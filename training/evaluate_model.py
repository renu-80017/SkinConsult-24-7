import numpy as np
import pandas as pd
from sklearn.metrics import (
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
)
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator

MODEL_PATH = "models/dermnet_model.h5"
TEST_DIR = "data/dermnet_merged/test"
OUT_CSV = "dermnet_eval_report.csv"

model = tf.keras.models.load_model(MODEL_PATH)

gen = ImageDataGenerator(preprocessing_function=preprocess_input).flow_from_directory(
    TEST_DIR,
    target_size=(224, 224),
    batch_size=32,
    class_mode="categorical",
    shuffle=False,
)

probs = model.predict(gen, verbose=1)
y_pred = np.argmax(probs, axis=1)
y_true = gen.classes
names = list(gen.class_indices.keys())

print("\nAccuracy:", round((y_pred == y_true).mean() * 100, 2), "%")
print("Balanced accuracy:", round(balanced_accuracy_score(y_true, y_pred) * 100, 2), "%\n")

report = classification_report(y_true, y_pred, target_names=names, digits=4, output_dict=True)
print(classification_report(y_true, y_pred, target_names=names, digits=4))

pd.DataFrame(report).transpose().to_csv(OUT_CSV)
print("Saved", OUT_CSV)
print("\nConfusion matrix:\n", confusion_matrix(y_true, y_pred))