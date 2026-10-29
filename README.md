# SkinConsult 24/7

**An AI-powered skin-health companion.** Upload a skin image, get the three most likely conditions from trained deep-learning models, chat with an AI Doctor, and download PDF reports and certificates.

> **Disclaimer:** This is an educational project, not a medical device. It does not diagnose any condition. Always consult a doctor or dermatologist.

## Contents
1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [How it works](#how-it-works)
4. [Models and results](#models-and-results)
5. [Data quality](#data-quality)
6. [Run locally](#run-locally)
7. [API example](#api-example)
8. [Docker](#docker)
9. [Models and data (DVC)](#models-and-data-dvc)
10. [Reproduce the training](#reproduce-the-training)
11. [Project structure](#project-structure)
12. [Limitations and future work](#limitations-and-future-work)

## Features

| Feature | Description |
|---|---|
| AI Analyzer | Three image classifiers (skin conditions, moles and lesions, burn severity). Each returns the top-3 predictions with confidence. |
| AI Doctor | Chat assistant running locally on Ollama (`llama3.2` for text, `llava:7b` when an image is attached). |
| Reports | Downloadable PDF reports for Analyzer results and AI Doctor chats. |
| Certificates | Generate, view and verify certificates. |
| Accounts | Signup and login with JWT authentication. |
| MLOps | MLflow experiment tracking, DVC data and model versioning, Docker setup. |

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React (Vite), react-router, framer-motion |
| Backend | FastAPI, SQLAlchemy (SQLite), JWT (python-jose), xhtml2pdf |
| Machine learning | TensorFlow / Keras, MobileNetV2 transfer learning |
| AI Doctor | Ollama (local LLMs) |
| MLOps | MLflow, DVC, Docker |

## How it works

```
Browser (React)  ->  FastAPI backend  ->  3 trained models (MobileNetV2)
                          |
                          +-> Ollama (AI Doctor chat)
                          +-> PDF reports, auth, database
```

1. The user uploads an image and picks an analysis type.
2. The backend resizes it to 224x224, applies MobileNetV2 preprocessing and runs the matching model.
3. The app shows the top-3 conditions with confidence scores.

## Models and results

All three models use transfer learning on a MobileNetV2 backbone with two-phase training (train the new head, then fine-tune the backbone), class weights and early stopping.

| Model | Dataset | Classes | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|---|---|
| Skin diseases | DermNet (de-duplicated, merged) | 11 | 49.75% (top-3: 77.39%) | 0.47 | 0.54 | 0.47 |
| Skin lesions / cancer | HAM10000 | 7 | 69.46% | 0.50 | 0.56 | 0.50 |
| Burn severity | Burns | 3 | 69.41% | 0.69 | 0.70 | 0.68 |

Precision, recall and F1 are **macro averages** over all classes.

**Classes**
- **DermNet (11):** Acne and Rosacea; Autoimmune and Systemic Conditions; Benign Growths; Drug Reactions and Blistering Conditions; Eczema and Dermatitis; Hair and Scalp Disorders; Pigmentation Disorders; Precancerous and Cancerous Lesions; Psoriasis and Related Disorders; Skin Infections (Bacterial, Fungal, Parasitic); Viral Skin Infections
- **HAM10000 (7):** akiec, bcc, bkl, df, mel, nv, vasc
- **Burns (3):** first degree, second degree, third degree

## Data quality

Reported numbers are honest, not inflated:

- **DermNet:** the merged dataset had about 30,000 files but only 14,208 unique images, and 463 images appeared in both train and test. Duplicates, leaked images and images filed under two different classes were removed (`training/build_clean_dermnet.py`). This lowered the apparent accuracy but made it reliable.
- **Burns:** 131 exact duplicate images were removed before the train/validation split.
- **HAM10000:** split by `lesion_id`, so images of the same lesion never appear on both sides.

## Run locally

**1. Backend** (from the project root)

```
pip install -r requirements-backend.txt
uvicorn backend.app:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

**2. Ollama** (for the AI Doctor)

```
ollama pull llama3.2
ollama pull llava:7b
```

**3. Frontend**

```
cd "skinconsult-24-7 (1)/skinconsult"
npm install
npm run dev
```

## API example

```
curl -X POST http://localhost:8000/predict \
  -F "file=@image.jpg" \
  -F "model_type=burns"
```

`model_type` is one of `dermnet`, `ham10000` or `burns`. The response has this shape:

```json
{
  "model_type": "burns",
  "predicted_class": "second_degree",
  "confidence": 0.52,
  "top_3": [
    {"class": "second_degree", "confidence": 0.52},
    {"class": "third_degree", "confidence": 0.27},
    {"class": "first_degree", "confidence": 0.21}
  ]
}
```

The values above are only an example of the format.

## Docker

```
docker compose up --build
```

The `models/` folder is mounted into the container. If Ollama runs somewhere else, set the `OLLAMA_URL` environment variable (the compose file points to the host machine by default).

## Models and data (DVC)

The model files and datasets are not stored in git. They are tracked with DVC (`models.dvc`, `data/*.dvc`) and stored in a local DVC remote. Only the small pointer files are in this repository.

## Reproduce the training

```
python training/merge_dermnet_categories.py
python training/build_clean_dermnet.py
python training/train_dermnet_v2.py
python training/train_ham10000_mlflow.py
python training/sort_burns.py
python training/train_burns_v2.py
python training/evaluate_model.py
python training/evaluate_topk.py
```

Experiments are logged to MLflow (`mlflow ui`).

## Project structure

```
SkinConsult 24-7/
|-- backend/                 FastAPI app: predict, auth, reports, AI Doctor
|-- training/                Data preparation, training and evaluation scripts
|-- skinconsult-24-7 (1)/
|   `-- skinconsult/         React (Vite) frontend
|-- models/                  Trained models (DVC)
|-- data/                    Datasets (DVC)
|-- Dockerfile
|-- docker-compose.yml
`-- requirements-backend.txt
```

## Limitations and future work

- Models were trained on a CPU-only laptop, which limits model size and accuracy.
- Classes are imbalanced and visually overlapping, especially in DermNet.
- The app is for demonstration and has not been clinically validated.
- Future work: stronger backbones (EfficientNet) on a GPU, test-time augmentation, cloud DVC storage, and a larger, cleaner dermatology dataset.