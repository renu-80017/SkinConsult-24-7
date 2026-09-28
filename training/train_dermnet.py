"""
Trains a skin disease classifier on the DermNet dataset using
transfer learning (MobileNetV2 backbone).

Input:  data/dermnet/train/<class_folders>/, data/dermnet/test/<class_folders>/
Output: models/dermnet_model.h5
"""

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pathlib import Path

# --- CONFIG ---
TRAIN_DIR = "data/dermnet/train"
TEST_DIR = "data/dermnet/test"
MODEL_OUT = "models/dermnet_model.h5"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10  # keep modest first run; can increase later

Path("models").mkdir(exist_ok=True)


def main():
    # --- Data generators ---
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

    num_classes = train_gen.num_classes
    print(f"Detected {num_classes} classes: {list(train_gen.class_indices.keys())}")

    # --- Build model (transfer learning) ---
    base_model = MobileNetV2(
        input_shape=IMG_SIZE + (3,),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # freeze base for first training pass

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

    # --- Train ---
    history = model.fit(
        train_gen,
        validation_data=test_gen,
        epochs=EPOCHS,
    )

    # --- Save ---
    model.save(MODEL_OUT)
    print(f"\nModel saved to {MODEL_OUT}")

    # --- Save class index mapping (needed later for predictions) ---
    import json
    with open("models/dermnet_class_indices.json", "w") as f:
        json.dump(train_gen.class_indices, f, indent=2)
    print("Class indices saved to models/dermnet_class_indices.json")


if __name__ == "__main__":
    main()