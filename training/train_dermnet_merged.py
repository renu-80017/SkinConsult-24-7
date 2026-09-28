"""
Trains a skin disease classifier on the MERGED DermNet dataset
(11 broader categories instead of 18 fine-grained ones), using
transfer learning (MobileNetV2 backbone). Logs the run to MLflow.

Input:  data/dermnet_merged/train/<11 folders>/, data/dermnet_merged/test/<11 folders>/
Output: models/dermnet_model.h5 (overwrites the previous 23-class model)
"""

import json
from pathlib import Path

import numpy as np
import mlflow
import mlflow.tensorflow
from sklearn.utils.class_weight import compute_class_weight

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# --- CONFIG ---
TRAIN_DIR = "data/dermnet_merged/train"
TEST_DIR = "data/dermnet_merged/test"
MODEL_OUT = "models/dermnet_model.h5"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 15

Path("models").mkdir(exist_ok=True)

# --- MLflow setup ---
mlflow.set_tracking_uri("sqlite:///mlflow.db")
mlflow.set_experiment("SkinConsult - DermNet Classifier")


def main():
    with mlflow.start_run(run_name="dermnet_merged_11_categories"):

        mlflow.log_param("img_size", IMG_SIZE)
        mlflow.log_param("batch_size", BATCH_SIZE)
        mlflow.log_param("epochs", EPOCHS)
        mlflow.log_param("base_model", "MobileNetV2")
        mlflow.log_param("base_trainable", False)
        mlflow.log_param("dataset_version", "merged_11_categories")

        train_datagen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            rotation_range=20,
            zoom_range=0.15,
            horizontal_flip=True,
        )
        test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

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
        print(f"Detected {num_classes} classes: {list(train_gen.class_indices.keys())}")
        mlflow.log_param("num_classes", num_classes)
        mlflow.log_param("class_names", list(train_gen.class_indices.keys()))

        # --- Class weights to handle imbalance across merged categories ---
        class_labels = list(train_gen.class_indices.keys())
        y_train = train_gen.classes
        class_weights_array = compute_class_weight(
            class_weight="balanced",
            classes=np.unique(y_train),
            y=y_train,
        )
        class_weights = {i: w for i, w in enumerate(class_weights_array)}
        print("Class weights:", class_weights)
        mlflow.log_dict(
            {class_labels[i]: w for i, w in class_weights.items()},
            "class_weights.json",
        )

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

        model = Model(inputs=base_model.input, outputs=predictions)

        model.compile(
            optimizer="adam",
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )

        model.summary()

        class MLflowLogger(tf.keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs=None):
                logs = logs or {}
                for key, value in logs.items():
                    mlflow.log_metric(key, value, step=epoch)

        history = model.fit(
            train_gen,
            validation_data=test_gen,
            epochs=EPOCHS,
            class_weight=class_weights,
            callbacks=[MLflowLogger()],
        )

        final_train_acc = history.history["accuracy"][-1]
        final_val_acc = history.history["val_accuracy"][-1]
        mlflow.log_metric("final_train_accuracy", final_train_acc)
        mlflow.log_metric("final_val_accuracy", final_val_acc)

        model.save(MODEL_OUT)
        print(f"\nModel saved to {MODEL_OUT}")

        with open("models/dermnet_class_indices.json", "w") as f:
            json.dump(train_gen.class_indices, f, indent=2)
        print("Class indices saved to models/dermnet_class_indices.json")

        mlflow.tensorflow.log_model(model, "model")
        mlflow.log_artifact("models/dermnet_class_indices.json")

        print(f"\nMLflow run logged. View with: mlflow ui")


if __name__ == "__main__":
    main()