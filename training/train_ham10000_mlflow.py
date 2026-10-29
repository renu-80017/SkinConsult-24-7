"""
Trains a skin lesion classifier on HAM10000 using transfer learning
(MobileNetV2 backbone) in two phases:
  Phase 1: train the new classification head with the backbone frozen.
  Phase 2: unfreeze the backbone and fine-tune with a small learning rate.

Handles class imbalance with class weights, splits by lesion_id so the same
lesion never appears in both train and validation, keeps the best weights
via early stopping, and logs everything to MLflow.

Resume: if the script is interrupted during phase 2, re-running it skips
phase 1 (reloads models/ham10000_phase1.h5) and resumes phase 2 from its
backup. To start completely fresh, delete models/ham10000_phase1.h5 and the
models/ham10000_backup_* folders first.

Input:
    data/ham10000/HAM10000_metadata.csv
    data/ham10000/HAM10000_images_part_1/
    data/ham10000/HAM10000_images_part_2/
Output:
    models/ham10000_model.h5
    models/ham10000_class_indices.json
"""

import json
import os
from pathlib import Path

import pandas as pd
import numpy as np
import mlflow
import mlflow.tensorflow
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import balanced_accuracy_score, classification_report

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# --- CONFIG ---
METADATA_CSV = "data/ham10000/HAM10000_metadata.csv"
IMAGES_DIR_1 = "data/ham10000/HAM10000_images_part_1"
IMAGES_DIR_2 = "data/ham10000/HAM10000_images_part_2"
MODEL_OUT = "models/ham10000_model.h5"
PHASE1_PATH = "models/ham10000_phase1.h5"
PHASE1_BACKUP = "models/ham10000_backup_phase1"
PHASE2_BACKUP = "models/ham10000_backup_phase2"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

PHASE1_EPOCHS = 10
PHASE1_LR = 1e-3
PHASE1_PATIENCE = 3

PHASE2_EPOCHS = 15
PHASE2_LR = 1e-5
PHASE2_PATIENCE = 4

Path("models").mkdir(exist_ok=True)

# --- MLflow setup ---
mlflow.set_tracking_uri("sqlite:///mlflow.db")
mlflow.set_experiment("SkinConsult - HAM10000 Classifier")


def resolve_image_path(image_id):
    for folder in (IMAGES_DIR_1, IMAGES_DIR_2):
        candidate = os.path.join(folder, f"{image_id}.jpg")
        if os.path.exists(candidate):
            return candidate
    return None


class MLflowLogger(tf.keras.callbacks.Callback):
    def __init__(self, step_offset=0):
        super().__init__()
        self.step_offset = step_offset

    def on_epoch_end(self, epoch, logs=None):
        for key, value in (logs or {}).items():
            mlflow.log_metric(key, value, step=epoch + self.step_offset)


def build_model(num_classes):
    base_model = MobileNetV2(
        input_shape=IMG_SIZE + (3,),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation="relu")(x)
    x = Dropout(0.3)(x)
    predictions = Dense(num_classes, activation="softmax")(x)
    return Model(inputs=base_model.input, outputs=predictions)


def main():
    with mlflow.start_run(run_name="ham10000_mobilenetv2_two_phase"):

        mlflow.log_param("img_size", IMG_SIZE)
        mlflow.log_param("batch_size", BATCH_SIZE)
        mlflow.log_param("base_model", "MobileNetV2")
        mlflow.log_param("phase1_epochs", PHASE1_EPOCHS)
        mlflow.log_param("phase1_lr", PHASE1_LR)
        mlflow.log_param("phase2_epochs", PHASE2_EPOCHS)
        mlflow.log_param("phase2_lr", PHASE2_LR)
        mlflow.log_param("split", "stratified_group_by_lesion_id")

        df = pd.read_csv(METADATA_CSV)
        df["filepath"] = df["image_id"].apply(resolve_image_path)
        df = df.dropna(subset=["filepath"]).reset_index(drop=True)

        print(f"Total usable images: {len(df)}")
        print(df["dx"].value_counts())
        mlflow.log_param("total_images", len(df))

        # Split by lesion_id so the same lesion never lands in both sets.
        sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
        train_idx, val_idx = next(sgkf.split(df, df["dx"], groups=df["lesion_id"]))
        train_df = df.iloc[train_idx]
        val_df = df.iloc[val_idx]
        print(f"Train images: {len(train_df)} | Validation images: {len(val_df)}")

        train_datagen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            rotation_range=20,
            zoom_range=0.15,
            horizontal_flip=True,
        )
        val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

        train_gen = train_datagen.flow_from_dataframe(
            train_df,
            x_col="filepath",
            y_col="dx",
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
        )

        val_gen = val_datagen.flow_from_dataframe(
            val_df,
            x_col="filepath",
            y_col="dx",
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
            shuffle=False,
        )

        num_classes = len(train_gen.class_indices)
        class_labels = list(train_gen.class_indices.keys())
        print(f"Detected {num_classes} classes: {class_labels}")
        mlflow.log_param("num_classes", num_classes)
        mlflow.log_param("class_names", class_labels)

        class_weights_array = compute_class_weight(
            class_weight="balanced",
            classes=np.array(class_labels),
            y=train_df["dx"].values,
        )
        class_weights = {i: w for i, w in enumerate(class_weights_array)}
        print("Class weights:", class_weights)
        mlflow.log_dict(
            {class_labels[i]: w for i, w in class_weights.items()},
            "class_weights.json",
        )

        # ---------------- PHASE 1: train the head, backbone frozen ----------------
        if os.path.exists(PHASE1_PATH):
            print(f"\nFound {PHASE1_PATH} - phase 1 already done, skipping it.")
            model = load_model(PHASE1_PATH)
            model.compile(
                optimizer=Adam(learning_rate=PHASE1_LR),
                loss="categorical_crossentropy",
                metrics=["accuracy"],
            )
            _, phase1_best = model.evaluate(val_gen, verbose=0)
        else:
            print("\n=== PHASE 1: training the classification head (backbone frozen) ===")
            model = build_model(num_classes)
            model.compile(
                optimizer=Adam(learning_rate=PHASE1_LR),
                loss="categorical_crossentropy",
                metrics=["accuracy"],
            )

            history1 = model.fit(
                train_gen,
                validation_data=val_gen,
                epochs=PHASE1_EPOCHS,
                class_weight=class_weights,
                callbacks=[
                    MLflowLogger(step_offset=0),
                    tf.keras.callbacks.BackupAndRestore(
                        backup_dir=PHASE1_BACKUP, save_freq="epoch"
                    ),
                    tf.keras.callbacks.EarlyStopping(
                        monitor="val_accuracy",
                        patience=PHASE1_PATIENCE,
                        restore_best_weights=True,
                        mode="max",
                    ),
                ],
            )
            phase1_best = max(history1.history["val_accuracy"])
            model.save(PHASE1_PATH)  # holds the best phase-1 weights

        print(f"Phase 1 best val_accuracy: {phase1_best:.4f}")
        mlflow.log_metric("phase1_best_val_accuracy", phase1_best)

        # ---------------- PHASE 2: fine-tune the backbone ----------------
        print("\n=== PHASE 2: fine-tuning the backbone ===")
        for layer in model.layers:
            # Keep BatchNorm layers frozen; it is more stable for fine-tuning.
            layer.trainable = not isinstance(layer, BatchNormalization)

        model.compile(
            optimizer=Adam(learning_rate=PHASE2_LR),
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )

        history2 = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=PHASE2_EPOCHS,
            class_weight=class_weights,
            callbacks=[
                MLflowLogger(step_offset=PHASE1_EPOCHS),
                tf.keras.callbacks.BackupAndRestore(
                    backup_dir=PHASE2_BACKUP, save_freq="epoch"
                ),
                tf.keras.callbacks.EarlyStopping(
                    monitor="val_accuracy",
                    patience=PHASE2_PATIENCE,
                    restore_best_weights=True,
                    mode="max",
                ),
            ],
        )
        phase2_best = max(history2.history["val_accuracy"])
        print(f"Phase 2 best val_accuracy: {phase2_best:.4f}")
        mlflow.log_metric("phase2_best_val_accuracy", phase2_best)

        # Keep whichever phase scored better.
        if phase2_best >= phase1_best:
            final_model = model  # best phase-2 weights already restored
            best_val = phase2_best
            print("Keeping the fine-tuned (phase 2) model.")
        else:
            final_model = load_model(PHASE1_PATH)
            best_val = phase1_best
            print("Fine-tuning did not help; keeping the phase 1 model.")

        mlflow.log_metric("final_val_accuracy", best_val)
        mlflow.log_metric("best_val_accuracy", best_val)

        # ---------------- Evaluation: accuracy alone is misleading here ----------------
        # About two thirds of HAM10000 is one class (nv), so a model that always
        # predicts "nv" already scores ~67% accuracy. Balanced accuracy and
        # per-class recall show how well the rare (and more dangerous) classes do.
        val_gen.reset()
        probs = final_model.predict(val_gen, verbose=0)
        y_pred = probs.argmax(axis=1)
        y_true = val_gen.classes

        bal_acc = balanced_accuracy_score(y_true, y_pred)
        report = classification_report(
            y_true, y_pred, target_names=class_labels, output_dict=True, zero_division=0
        )
        print(f"\nBalanced accuracy: {bal_acc:.4f}")
        print(classification_report(y_true, y_pred, target_names=class_labels, zero_division=0))
        mlflow.log_metric("balanced_accuracy", bal_acc)
        mlflow.log_dict(report, "classification_report.json")

        final_model.save(MODEL_OUT)
        print(f"\nModel saved to {MODEL_OUT}")

        with open("models/ham10000_class_indices.json", "w") as f:
            json.dump(train_gen.class_indices, f, indent=2)
        print("Class indices saved to models/ham10000_class_indices.json")

        mlflow.tensorflow.log_model(final_model, "model")
        mlflow.log_artifact("models/ham10000_class_indices.json")

        print("\nMLflow run logged. View with: mlflow ui")


if __name__ == "__main__":
    main()