import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator

MODEL_PATH = "models/dermnet_model_v2.h5"
TEST_DIR = "data/dermnet_clean/test"

model = tf.keras.models.load_model(MODEL_PATH, compile=False)
gen = ImageDataGenerator(preprocessing_function=preprocess_input).flow_from_directory(
    TEST_DIR, target_size=(224, 224), batch_size=32,
    class_mode="categorical", shuffle=False,
)

probs = model.predict(gen, verbose=1)
y_true = gen.classes
order = np.argsort(-probs, axis=1)

for k in (1, 2, 3):
    hit = np.mean([y_true[i] in order[i, :k] for i in range(len(y_true))])
    print(f"Top-{k} accuracy: {hit * 100:.2f} %")