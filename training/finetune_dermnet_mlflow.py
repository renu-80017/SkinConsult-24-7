"""
Fine-tunes the existing DermNet model by unfreezing the ENTIRE
MobileNetV2 base and training further with a very small learning rate.
Logs the run to MLflow.

Input:  models/dermnet_model.h5 (existing model)
Output: models/dermnet_model.h5 (overwritten ONLY if val_accuracy improves)
"""

import numpy as np
import mlflow
import mlflow.tensorflow

import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
from tensorflow.keras.optimizers import Adam
from sklearn.utils.class_weight import compute_class_weight

# --- CONFIG ---
TRAIN_DIR = "data/dermnet_merged/train"
TEST_DIR = "data/dermnet_merged/test"
MODEL_PATH = "models/dermnet_model.h5"
BEST_MODEL_PATH = "models/dermnet_model_best.h5"
BACKUP_DIR = "models/dermnet_training_backup"

IMG_SIZE = (224, 224)
BATCH_SIZE = 64
FINE_TUNE_EPOCHS = 30
LEARNING_RATE = 5e-6

# --- MLflow setup ---
mlflow.set_tracking_uri("sqlite:///mlflow.db")
mlflow.set_experiment("SkinConsult - DermNet Classifier")


def main():
    with mlflow.start_run(run_name="dermnet_full_unfreeze_finetune"):

        mlflow.log_param("img_size", IMG_SIZE)
        mlflow.log_param("batch_size", BATCH_SIZE)
        mlflow.log_param("epochs", FINE_TUNE_EPOCHS)
        mlflow.log_param("learning_rate", LEARNING_RATE)
        mlflow.log_param("base_model", "MobileNetV2")
        mlflow.log_param("fine_tune_mode", "full_network_unfrozen")
        mlflow.log_param("starting_from", "previous_dermnet_model.h5")

        train_datagen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            rotation_range=20,
            zoom_range=0.15,
            horizontal_flip=True,
        )

        test_datagen = ImageDataGenerator(
            preprocessing_function=preprocess_input
        )

        train_gen = train_datagen.flow_from_directory(
            TRAIN_DIR,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
        )

        test_gen = test_datagen.flow_from_directory(
            TEST_DIR,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
            shuffle=False,
        )

        num_classes = len(train_gen.class_indices)

        mlflow.log_param("num_classes", num_classes)
        mlflow.log_param(
            "class_names",
            list(train_gen.class_indices.keys())
        )

        # --- Class weights to counter imbalance (Hair/Scalp has 8x fewer
        # images than Eczema, etc.) ---
        class_weights_array = compute_class_weight(
            class_weight="balanced",
            classes=np.unique(train_gen.classes),
            y=train_gen.classes,
        )
        class_weight = {i: w for i, w in enumerate(class_weights_array)}
        mlflow.log_param("class_weight", {k: round(v, 3) for k, v in class_weight.items()})

        print("Loading existing model...")
        model = load_model(MODEL_PATH)

        model_output_classes = model.output_shape[-1]
        if model_output_classes != num_classes:
            raise ValueError(
                f"Class count mismatch: the loaded model at {MODEL_PATH} "
                f"outputs {model_output_classes} classes, but the training "
                f"data in {TRAIN_DIR} has {num_classes} classes "
                f"({list(train_gen.class_indices.keys())}). "
                f"Point TRAIN_DIR/TEST_DIR to the dataset that matches "
                f"this model's class count, or retrain from scratch with "
                f"this dataset instead of fine-tuning."
            )

        for layer in model.layers:
            layer.trainable = True

        print(f"Unfroze all {len(model.layers)} layers of the model.")

        mlflow.log_param(
            "total_layers_unfrozen",
            len(model.layers)
        )

        model.compile(
            optimizer=Adam(learning_rate=LEARNING_RATE),
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )

        model.summary()

        class MLflowLogger(tf.keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs=None):
                logs = logs or {}
                for key, value in logs.items():
                    mlflow.log_metric(key, value, step=epoch)

        backup_callback = tf.keras.callbacks.BackupAndRestore(
            backup_dir=BACKUP_DIR,
            save_freq="epoch",
        )

        checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
            filepath=BEST_MODEL_PATH,
            monitor="val_accuracy",
            save_best_only=True,
            mode="max",
            verbose=1,
        )

        early_stop_callback = tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=4,
            restore_best_weights=True,
            mode="max",
        )

        history = model.fit(
            train_gen,
            validation_data=test_gen,
            epochs=FINE_TUNE_EPOCHS,
            class_weight=class_weight,
            callbacks=[
                MLflowLogger(),
                backup_callback,
                checkpoint_callback,
                early_stop_callback,
            ],
        )

        final_train_acc = history.history["accuracy"][-1]
        final_val_acc = history.history["val_accuracy"][-1]
        best_val_acc = max(history.history["val_accuracy"])

        mlflow.log_metric("final_train_accuracy", final_train_acc)
        mlflow.log_metric("final_val_accuracy", final_val_acc)
        mlflow.log_metric("best_val_accuracy", best_val_acc)

        model.save(MODEL_PATH)

        print(f"\nBest model (val_accuracy={best_val_acc:.4f}) saved to {MODEL_PATH}")

        mlflow.tensorflow.log_model(model, "model")

        print("\nMLflow run logged. View with: mlflow ui")


if __name__ == "__main__":
    main()