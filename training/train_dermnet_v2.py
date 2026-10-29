"""
DermNet v2 - trained from scratch on the de-duplicated dataset.
MobileNetV2, two phases, class weights, label smoothing, stronger augmentation.
Validation is a held-out slice of train; the test set is used once at the end.

Input : data/dermnet_clean/{train,test}/<class>/*.jpg
Output: models/dermnet_model_v2.h5, models/dermnet_class_indices.json
"""

import json
import os
from pathlib import Path

import numpy as np
import mlflow
import mlflow.tensorflow
from sklearn.metrics import balanced_accuracy_score, classification_report
from sklearn.utils.class_weight import compute_class_weight

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# --- CONFIG ---
TRAIN_DIR = "data/dermnet_clean/train"
TEST_DIR = "data/dermnet_clean/test"
MODEL_OUT = "models/dermnet_model_v2.h5"
PHASE1_PATH = "models/dermnet_v2_phase1.h5"
CLASS_INDEX_OUT = "models/dermnet_class_indices.json"
BACKUP1 = "models/dermnet_v2_backup_phase1"
BACKUP2 = "models/dermnet_v2_backup_phase2"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
VAL_SPLIT = 0.15

PHASE1_EPOCHS, PHASE1_LR, PHASE1_PATIENCE = 15, 1e-3, 4
PHASE2_EPOCHS, PHASE2_LR, PHASE2_PATIENCE = 25, 2e-5, 5

Path("models").mkdir(exist_ok=True)

mlflow.set_tracking_uri("sqlite:///mlflow.db")
mlflow.set_experiment("SkinConsult - DermNet v2 (clean)")


def build_model(num_classes):
    base = MobileNetV2(input_shape=IMG_SIZE + (3,), include_top=False, weights="imagenet")
    base.trainable = False
    x = GlobalAveragePooling2D()(base.output)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.4)(x)
    out = Dense(num_classes, activation="softmax")(x)
    return Model(base.input, out)


def compile_model(model, lr):
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=["accuracy"],
    )


class MLflowLogger(tf.keras.callbacks.Callback):
    def __init__(self, prefix):
        super().__init__()
        self.prefix = prefix

    def on_epoch_end(self, epoch, logs=None):
        for k, v in (logs or {}).items():
            mlflow.log_metric(f"{self.prefix}_{k}", v, step=epoch)


def callbacks(prefix, patience, backup_dir):
    return [
        tf.keras.callbacks.BackupAndRestore(backup_dir=backup_dir),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=patience,
            restore_best_weights=True, mode="max",
        ),
        MLflowLogger(prefix),
    ]


def main():
    with mlflow.start_run(run_name="dermnet_v2_clean_two_phase"):
        train_gen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            validation_split=VAL_SPLIT,
            rotation_range=30,
            zoom_range=0.25,
            width_shift_range=0.1,
            height_shift_range=0.1,
            brightness_range=(0.8, 1.2),
            horizontal_flip=True,
            vertical_flip=True,
        ).flow_from_directory(
            TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
            class_mode="categorical", subset="training", shuffle=True, seed=42,
        )
        val_gen = ImageDataGenerator(
            preprocessing_function=preprocess_input, validation_split=VAL_SPLIT
        ).flow_from_directory(
            TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
            class_mode="categorical", subset="validation", shuffle=False,
        )
        test_gen = ImageDataGenerator(
            preprocessing_function=preprocess_input
        ).flow_from_directory(
            TEST_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
            class_mode="categorical", shuffle=False,
        )

        if train_gen.class_indices != test_gen.class_indices:
            raise ValueError("Train and test class folders do not match.")
        class_names = list(train_gen.class_indices.keys())
        num_classes = len(class_names)
        print("Classes:", train_gen.class_indices)
        mlflow.log_param("num_classes", num_classes)
        mlflow.log_param("train_images", train_gen.samples)
        mlflow.log_param("val_images", val_gen.samples)
        mlflow.log_param("test_images", test_gen.samples)

        weights = compute_class_weight(
            "balanced", classes=np.arange(num_classes), y=train_gen.classes
        )
        class_weights = {i: w for i, w in enumerate(weights)}
        print("Class weights:", class_weights)

        # ---- PHASE 1: train the new head (skipped if already done) ----
        if os.path.exists(PHASE1_PATH):
            print("Found phase 1 model - skipping phase 1.")
            model = tf.keras.models.load_model(PHASE1_PATH, compile=False)
            compile_model(model, PHASE1_LR)
            p1_best = model.evaluate(val_gen, verbose=0)[1]
        else:
            print("\n=== PHASE 1: training the head (backbone frozen) ===")
            model = build_model(num_classes)
            compile_model(model, PHASE1_LR)
            h1 = model.fit(
                train_gen, validation_data=val_gen, epochs=PHASE1_EPOCHS,
                class_weight=class_weights,
                callbacks=callbacks("phase1", PHASE1_PATIENCE, BACKUP1),
            )
            p1_best = max(h1.history["val_accuracy"])
            model.save(PHASE1_PATH)
        p1_weights = model.get_weights()
        print(f"Phase 1 best val_accuracy: {p1_best:.4f}")

        # ---- PHASE 2: fine-tune everything except BatchNorm ----
        print("\n=== PHASE 2: fine-tuning the backbone ===")
        for layer in model.layers:
            layer.trainable = not isinstance(layer, tf.keras.layers.BatchNormalization)
        compile_model(model, PHASE2_LR)
        h2 = model.fit(
            train_gen, validation_data=val_gen, epochs=PHASE2_EPOCHS,
            class_weight=class_weights,
            callbacks=callbacks("phase2", PHASE2_PATIENCE, BACKUP2),
        )
        p2_best = max(h2.history["val_accuracy"])
        print(f"Phase 2 best val_accuracy: {p2_best:.4f}")

        if p2_best < p1_best:
            model.set_weights(p1_weights)
            print("Keeping the phase 1 model (phase 2 did not improve).")
        else:
            print("Keeping the fine-tuned (phase 2) model.")

        # ---- Final evaluation on the untouched test set ----
        probs = model.predict(test_gen, verbose=1)
        y_pred = np.argmax(probs, axis=1)
        y_true = test_gen.classes
        acc = float((y_pred == y_true).mean())
        bal = float(balanced_accuracy_score(y_true, y_pred))
        report = classification_report(
            y_true, y_pred, target_names=class_names, digits=4, output_dict=True
        )

        print(f"\nTEST Accuracy: {acc * 100:.2f} %")
        print(f"TEST Balanced accuracy: {bal * 100:.2f} %\n")
        print(classification_report(y_true, y_pred, target_names=class_names, digits=4))

        mlflow.log_metric("test_accuracy", acc)
        mlflow.log_metric("test_balanced_accuracy", bal)
        mlflow.log_metric("test_macro_precision", report["macro avg"]["precision"])
        mlflow.log_metric("test_macro_recall", report["macro avg"]["recall"])
        mlflow.log_metric("test_macro_f1", report["macro avg"]["f1-score"])

        model.save(MODEL_OUT)
        with open(CLASS_INDEX_OUT, "w") as f:
            json.dump(train_gen.class_indices, f, indent=2)
        print(f"\nModel saved to {MODEL_OUT}")
        print(f"Class indices saved to {CLASS_INDEX_OUT}")
        mlflow.log_artifact(CLASS_INDEX_OUT)
        print("\nMLflow run logged.")


if __name__ == "__main__":
    main()