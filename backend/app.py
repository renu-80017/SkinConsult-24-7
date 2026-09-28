"""
FastAPI backend for SkinConsult 24/7.

Loads all 3 trained models at startup, handles auth, PDF report
generation (Analyzer + AI Doctor chat), and the AI Doctor endpoint
(local Ollama).

Run with:
    uvicorn backend.app:app --reload
"""

import json
import io
import requests
from pathlib import Path
from datetime import datetime

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

from backend.database import get_db, init_db, User
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    seed_demo_account,
)

# --- CONFIG ---
BACKEND_DIR = Path(__file__).resolve().parent
MODELS_DIR = Path("models")
IMG_SIZE = (224, 224)

MODEL_FILES = {
    "dermnet": "dermnet_model.h5",
    "ham10000": "ham10000_model.h5",
    "burns": "burns_model.h5",
}

CLASS_INDEX_FILES = {
    "dermnet": "dermnet_class_indices.json",
    "ham10000": "ham10000_class_indices.json",
    "burns": "burns_class_indices.json",
}

MODEL_LABELS = {
    "dermnet": "Skin Condition Analysis",
    "ham10000": "Mole & Lesion Check",
    "burns": "Burn Severity Assessment",
}

# --- Ollama config ---
OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "llama3.2:latest"
OLLAMA_VISION_MODEL = "llava:7b"

AI_DOCTOR_SYSTEM_PROMPT = """You are AI Doctor, a friendly and knowledgeable skin-health
assistant inside the SkinConsult 24/7 app. You give clear, educational information about
skin conditions, general skincare, and when relevant, simple diet/nutrition guidance that
supports skin health. You are NOT a licensed medical professional, and every response
should make that clear when giving any health-related guidance. Never diagnose with
certainty — describe possibilities and always recommend seeing a dermatologist or doctor
for anything serious, persistent, or worsening. Keep answers clear, warm, and easy to
understand for a non-medical audience."""

# --- App setup ---
app = FastAPI(title="SkinConsult 24/7 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

# --- Jinja2 environment for PDF templates ---
jinja_env = Environment(loader=FileSystemLoader(str(BACKEND_DIR)))

# --- Load models and class mappings once at startup ---
models = {}
class_names = {}

print("Loading models...")
for model_type, filename in MODEL_FILES.items():
    model_path = MODELS_DIR / filename
    models[model_type] = load_model(model_path)

    with open(MODELS_DIR / CLASS_INDEX_FILES[model_type]) as f:
        class_indices = json.load(f)

    inverted = {v: k for k, v in class_indices.items()}
    class_names[model_type] = [inverted[i] for i in range(len(inverted))]

    print(f"  Loaded {model_type}: {len(class_names[model_type])} classes")

print("All models loaded.")

init_db()
seed_demo_account()


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img)
    arr = np.expand_dims(arr, axis=0)
    arr = preprocess_input(arr)
    return arr


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if token is None:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    return user


# --- Pydantic schemas ---
class SignUpRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str


class ChatMessage(BaseModel):
    role: str
    content: str
    image_base64: str | None = None


class ConsultationRequest(BaseModel):
    messages: list[ChatMessage]


class ChatReportRequest(BaseModel):
    patient_name: str | None = None
    messages: list[dict]
    image_base64: str | None = None


# --- Basic health check ---
@app.get("/")
def root():
    return {"status": "SkinConsult 24/7 API is running"}


# --- Prediction ---
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model_type: str = Form(...),
):
    if model_type not in models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model_type '{model_type}'. Must be one of: {list(models.keys())}",
        )

    image_bytes = await file.read()

    try:
        input_array = preprocess_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")

    model = models[model_type]
    predictions = model.predict(input_array)[0]

    predicted_index = int(np.argmax(predictions))
    predicted_class = class_names[model_type][predicted_index]
    confidence = float(predictions[predicted_index])

    top_indices = np.argsort(predictions)[::-1][:3]
    top_3 = [
        {"class": class_names[model_type][i], "confidence": float(predictions[i])}
        for i in top_indices
    ]

    return {
        "model_type": model_type,
        "predicted_class": predicted_class,
        "confidence": confidence,
        "top_3": top_3,
    }


# --- Analyzer PDF report ---
@app.post("/generate-report")
async def generate_report(payload: dict = Body(...)):
    template = jinja_env.get_template("report_template.html")

    report_id = "SC-" + datetime.utcnow().strftime("%y%m%d%H%M%S")
    report_date = datetime.utcnow().strftime("%B %d, %Y")

    html_out = template.render(
        report_id=report_id,
        report_date=report_date,
        model_label=MODEL_LABELS.get(payload.get("model_type"), payload.get("model_type")),
        **payload,
    )

    pdf_buffer = io.BytesIO()
    pisa.CreatePDF(html_out, dest=pdf_buffer)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{report_id}.pdf"'},
    )


# --- AI Doctor chat report (NEW) ---
@app.post("/generate-chat-report")
async def generate_chat_report(payload: ChatReportRequest):
    template = jinja_env.get_template("chat_report_template.html")

    report_id = "SC-" + datetime.utcnow().strftime("%y%m%d%H%M%S")
    report_date = datetime.utcnow().strftime("%B %d, %Y")

    html_out = template.render(
        report_id=report_id,
        report_date=report_date,
        patient_name=payload.patient_name or "Not provided",
        messages=payload.messages,
        image_base64=payload.image_base64,
    )

    pdf_buffer = io.BytesIO()
    pisa.CreatePDF(html_out, dest=pdf_buffer)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{report_id}.pdf"'},
    )


# --- Auth ---
@app.post("/auth/signup")
def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"status": "ok"}


@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})

    return {
        "access_token": token,
        "user": {"id": user.id, "full_name": user.full_name, "email": user.email},
    }


@app.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user


# --- AI Doctor chat ---
@app.post("/api/consultations")
async def consult(payload: ConsultationRequest):
    has_image = any(m.image_base64 for m in payload.messages)
    model_to_use = OLLAMA_VISION_MODEL if has_image else OLLAMA_MODEL

    ollama_messages = [{"role": "system", "content": AI_DOCTOR_SYSTEM_PROMPT}]
    for m in payload.messages:
        entry = {"role": m.role, "content": m.content}
        if m.image_base64:
            entry["images"] = [m.image_base64]
        ollama_messages.append(entry)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": model_to_use, "messages": ollama_messages, "stream": False},
            timeout=180,
        )
        response.raise_for_status()
        data = response.json()
        return {"role": "assistant", "content": data["message"]["content"]}

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Ollama. Make sure Ollama is running.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Doctor error: {e}")