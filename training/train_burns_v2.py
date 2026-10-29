"""
Burns severity classifier (3 classes) - improved version.
MobileNetV2 transfer learning, two phases, class weights, early stopping.
Removes exact duplicate images before splitting to avoid leakage.

Input : data/burns_sorted/<first_degree|second_degree|third_degree>/*.jpg
Output: models/burns_model_v2.h5, models/burns_class_indices.json
"""

import hashlib
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
import mlflow
import mlflow.tensorflow
from sklearn.metrics import balanced_accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# --- CONFIG ---
DATA_DIR = "data/burns_sorted"
MODEL_OUT = "models/burns_model_v2.h5"
CLASS_INDEX_OUT = "models/burns_class_indices.json"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
IMG_EXT = (".jpg", ".jpeg", ".png", ".bmp")

PHASE1_EPOCHS, PHASE1_LR, PHASE1_PATIENCE = 12, 1e-3, 4
PHASE2_EPOCHS, PHASE2_LR, PHASE2_PATIENCE = 20, 1e-5, 5

Path("models").mkdir(exist_ok=True)

mlflow.set_tracking_uri("sqlite:///mlflow.db")
mlflow.set_experiment("SkinConsult - Burns Classifier")


def load_dataframe():
    rows, seen, dupes = [], set(), 0
    for cls in sorted(os.listdir(DATA_DIR)):
        cls_path = os.path.join(DATA_DIR, cls)
        if not os.path.isdir(cls_path):
            continue
        for f in sorted(os.listdir(cls_path)):
            if not f.lower().endswith(IMG_EXT):
                continue
            path = os.path.join(cls_path, f)
            with open(path, "rb") as fh:
                digest = hashlib.md5(fh.read()).hexdigest()
            if digest in seen:
                dupes += 1
                continue
            seen.add(digest)
            rows.append({"filepath": path, "label": cls})
    print(f"Removed {dupes} exact duplicate images")
    return pd.DataFrame(rows), dupes


def build_model(num_classes):
    base = MobileNetV2(input_shape=IMG_SIZE + (3,), include_top=False, weights="imagenet")
    base.trainable = False
    x = GlobalAveragePooling2D()(base.output)
    x = Dense(128, activation="relu")(x)
    x = Dropout(0.4)(x)
    out = Dense(num_classes, activation="softmax")(x)
    return Model(base.input, out), base


def compile_model(model, lr):
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )


def main():
    with mlflow.start_run(run_name="burns_mobilenetv2_two_phase"):
        df, dupes = load_dataframe()
        print(df["label"].value_counts())
        mlflow.log_param("total_images", len(df))
        mlflow.log_param("duplicates_removed", dupes)

        train_df, val_df = train_test_split(
            df, test_size=0.2, stratify=df["label"], random_state=42
        )

        train_gen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            rotation_range=25,
            zoom_range=0.2,
            width_shift_range=0.1,
            height_shift_range=0.1,
            brightness_range=(0.8, 1.2),
            horizontal_flip=True,
        ).flow_from_dataframe(
            train_df, x_col="filepath", y_col="label",
            target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode="categorical",
        )
        val_gen = ImageDataGenerator(
            preprocessing_function=preprocess_input
        ).flow_from_dataframe(
            val_df, x_col="filepath", y_col="label",
            target_size=IMG_SIZE, batch_size=BATCH_SIZE,
            class_mode="categorical", shuffle=False,
        )

        class_names = list(train_gen.class_indices.keys())
        num_classes = len(class_names)
        print("Classes:", train_gen.class_indices)
        mlflow.log_param("class_names", class_names)

        weights = compute_class_weight(
            "balanced", classes=np.array(class_names), y=train_df["label"].values
        )
        class_weights = {i: w for i, w in enumerate(weights)}
        print("Class weights:", class_weights)

        model, base = build_model(num_classes)

        class MLflowLogger(tf.keras.callbacks.Callback):
            def __init__(self, prefix):
                super().__init__()
                self.prefix = prefix
                self.step = 0

            def on_epoch_end(self, epoch, logs=None):
                for k, v in (logs or {}).items():
                    mlflow.log_metric(f"{self.prefix}_{k}", v, step=epoch)

        def stopper(patience):
            return tf.keras.callbacks.EarlyStopping(
                monitor="val_accuracy", patience=patience,
                restore_best_weights=True, mode="max",
            )

        # ---- PHASE 1: train the new head only ----
        print("\n=== PHASE 1: training the head (backbone frozen) ===")
        compile_model(model, PHASE1_LR)
        h1 = model.fit(
            train_gen, validation_data=val_gen, epochs=PHASE1_EPOCHS,
            class_weight=class_weights,
            callbacks=[stopper(PHASE1_PATIENCE), MLflowLogger("phase1")],
        )
        p1_best = max(h1.history["val_accuracy"])
        p1_weights = model.get_weights()
        print(f"Phase 1 best val_accuracy: {p1_best:.4f}")

        # ---- PHASE 2: fine-tune the backbone (BatchNorm stays frozen) ----
        print("\n=== PHASE 2: fine-tuning the backbone ===")
        base.trainable = True
        for layer in base.layers:
            if isinstance(layer, tf.keras.layers.BatchNormalization):
                layer.trainable = False
        compile_model(model, PHASE2_LR)
        h2 = model.fit(
            train_gen, validation_data=val_gen, epochs=PHASE2_EPOCHS,
            class_weight=class_weights,
            callbacks=[stopper(PHASE2_PATIENCE), MLflowLogger("phase2")],
        )
        p2_best = max(h2.history["val_accuracy"])
        print(f"Phase 2 best val_accuracy: {p2_best:.4f}")

        if p2_best < p1_best:
            model.set_weights(p1_weights)
            print("Keeping the phase 1 model (phase 2 did not improve).")
        else:
            print("Keeping the fine-tuned (phase 2) model.")

        # ---- Final evaluation ----
        probs = model.predict(val_gen, verbose=1)
        y_pred = np.argmax(probs, axis=1)
        y_true = val_gen.classes
        acc = float((y_pred == y_true).mean())
        bal = float(balanced_accuracy_score(y_true, y_pred))
        report = classification_report(
            y_true, y_pred, target_names=class_names, digits=4, output_dict=True
        )

        print(f"\nAccuracy: {acc * 100:.2f} %")
        print(f"Balanced accuracy: {bal * 100:.2f} %\n")
        print(classification_report(y_true, y_pred, target_names=class_names, digits=4))

        mlflow.log_metric("val_accuracy_final", acc)
        mlflow.log_metric("balanced_accuracy", bal)
        mlflow.log_metric("macro_precision", report["macro avg"]["precision"])
        mlflow.log_metric("macro_recall", report["macro avg"]["recall"])
        mlflow.log_metric("macro_f1", report["macro avg"]["f1-score"])

        model.save(MODEL_OUT)
        with open(CLASS_INDEX_OUT, "w") as f:
            json.dump(train_gen.class_indices, f, indent=2)
        print(f"\nModel saved to {MODEL_OUT}")
        print(f"Class indices saved to {CLASS_INDEX_OUT}")
        mlflow.log_artifact(CLASS_INDEX_OUT)
        print("\nMLflow run logged.")


if __name__ == "__main__":
    main()