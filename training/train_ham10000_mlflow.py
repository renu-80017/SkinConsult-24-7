"""
Trains a skin lesion classifier on HAM10000 using transfer learning
(MobileNetV2 backbone). Handles class imbalance with class weights.
Logs the run to MLflow.

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
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# --- CONFIG ---
METADATA_CSV = "data/ham10000/HAM10000_metadata.csv"
IMAGES_DIR_1 = "data/ham10000/HAM10000_images_part_1"
IMAGES_DIR_2 = "data/ham10000/HAM10000_images_part_2"
MODEL_OUT = "models/ham10000_model.h5"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

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


def main():
    with mlflow.start_run(run_name="ham10000_mobilenetv2_baseline"):

        mlflow.log_param("img_size", IMG_SIZE)
        mlflow.log_param("batch_size", BATCH_SIZE)
        mlflow.log_param("epochs", EPOCHS)
        mlflow.log_param("base_model", "MobileNetV2")
        mlflow.log_param("base_trainable", False)

        df = pd.read_csv(METADATA_CSV)
        df["filepath"] = df["image_id"].apply(resolve_image_path)
        df = df.dropna(subset=["filepath"])

        print(f"Total usable images: {len(df)}")
        print(df["dx"].value_counts())
        mlflow.log_param("total_images", len(df))

        train_df, val_df = train_test_split(
            df, test_size=0.2, stratify=df["dx"], random_state=42
        )

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
        print(f"Detected {num_classes} classes: {list(train_gen.class_indices.keys())}")
        mlflow.log_param("num_classes", num_classes)
        mlflow.log_param("class_names", list(train_gen.class_indices.keys()))

        class_labels = list(train_gen.class_indices.keys())
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
            validation_data=val_gen,
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

        with open("models/ham10000_class_indices.json", "w") as f:
            json.dump(train_gen.class_indices, f, indent=2)
        print("Class indices saved to models/ham10000_class_indices.json")

        mlflow.tensorflow.log_model(model, "model")
        mlflow.log_artifact("models/ham10000_class_indices.json")

        print(f"\nMLflow run logged. View with: mlflow ui")


if __name__ == "__main__":
    main()