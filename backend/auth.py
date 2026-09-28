"""
Authentication utilities for SkinConsult 24/7:
- Password hashing (bcrypt)
- JWT token creation/verification
- Demo account seeding
"""

from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

from backend.database import SessionLocal, User

# --- Config ---
SECRET_KEY = "skinconsult-24-7-demo-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def seed_demo_account():
    """Creates a demo student account if it doesn't already exist."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "student@skinconsult.com").first()
        if not existing:
            demo_user = User(
                full_name="Demo Student",
                email="student@skinconsult.com",
                hashed_password=hash_password("student123"),
            )
            db.add(demo_user)
            db.commit()
            print("Demo student account created: student@skinconsult.com / student123")
        else:
            print("Demo student account already exists.")
    finally:
        db.close()