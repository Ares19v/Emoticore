"""
main.py — EMOTICORE Intelligence Engine | FastAPI Application Entry Point

Routes:
  GET  /                          Health check
  POST /register                  Create a new user account (password is bcrypt-hashed)
  POST /login                     Authenticate and receive a JWT access token
  POST /analyze                   Run NLP + AI analysis (JWT required)
  GET  /history/{user_id}         Retrieve user's analysis history (JWT required)
  GET  /history/{user_id}/export  Download history as a CSV file (JWT required)
  GET  /admin/users               List all users (Admin key required)
"""

import csv
import io
import logging
import os

import nltk
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from . import database, models, processor, schemas
from .auth import (
    create_access_token,
    get_current_user_id,
    hash_password,
    verify_password,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("emoticore")

# ---------------------------------------------------------------------------
# NLTK corpora (downloaded once on startup)
# ---------------------------------------------------------------------------
for corpus in ["brown", "punkt", "punkt_tab", "averaged_perceptron_tagger"]:
    nltk.download(corpus, quiet=True)

# ---------------------------------------------------------------------------
# App & DB initialisation
# ---------------------------------------------------------------------------
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="EMOTICORE Intelligence Engine",
    description="Transform text and documents into actionable insights.",
    version="6.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# DB session dependency
# ---------------------------------------------------------------------------
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Admin auth dependency
# ---------------------------------------------------------------------------
ADMIN_KEY: str = os.environ.get("ADMIN_KEY", "emoticore-admin-dev-key")


def verify_admin(x_admin_key: Optional[str] = None):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key.",
        )


# ---------------------------------------------------------------------------
# Routes — Public
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def read_root():
    return {"status": "Online", "version": "6.0.0"}


@app.post("/register", status_code=status.HTTP_201_CREATED, response_model=schemas.UserResponse, tags=["Auth"])
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user. Password is bcrypt-hashed before storage."""
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")
    hashed = hash_password(user.password)
    new_user = models.User(username=user.username, password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info("New user registered: %s (id=%s)", new_user.username, new_user.id)
    return new_user


@app.post("/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Authenticate a user and return a signed JWT access token."""
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )
    token = create_access_token({"user_id": db_user.id, "username": db_user.username})
    logger.info("User logged in: %s (id=%s)", db_user.username, db_user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "username": db_user.username,
    }


# ---------------------------------------------------------------------------
# Routes — Analysis & History (Public)
# ---------------------------------------------------------------------------

@app.post("/analyze", tags=["Analysis"])
async def analyze(
    original_text: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Run NLP + AI analysis on submitted text or PDF(s).
    Open access — no login required.
    """
    results_count = 0

    if files and len(files) > 0:
        for file in files:
            content = await file.read()
            text = processor.extract_text_from_pdf(content)
            if not text.strip():
                logger.warning("Could not extract text from %s", file.filename)
                continue
            analysis = processor.analyze_text_input(text)
            record = models.InsightRecord(
                **analysis,
                original_text=f"PDF: {file.filename}",
                owner_id=None,
            )
            db.add(record)
            results_count += 1
    elif original_text:
        analysis = processor.analyze_text_input(original_text)
        record = models.InsightRecord(
            **analysis,
            original_text=original_text[:500],
            owner_id=None,
        )
        db.add(record)
        results_count += 1

    if results_count == 0:
        raise HTTPException(status_code=400, detail="No valid input provided.")

    db.commit()
    logger.info("Analysis complete | records=%s", results_count)
    return {"status": "Complete", "count": results_count}


@app.get("/history", response_model=List[schemas.InsightResponse], tags=["History"])
def get_all_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Retrieve recent paginated analysis history."""
    return (
        db.query(models.InsightRecord)
        .order_by(models.InsightRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@app.get("/history/export", tags=["History"])
def export_history_csv(
    db: Session = Depends(get_db),
):
    """Download analysis history as a CSV file."""
    records = db.query(models.InsightRecord).order_by(models.InsightRecord.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Text (Preview)", "Sentiment Score", "Sentiment Label",
        "Subjectivity", "Readability Grade", "Word Count", "Reading Time (min)",
        "Key Phrases", "AI Summary", "Created At",
    ])
    for r in records:
        writer.writerow([
            r.id, r.original_text, r.sentiment_score, r.sentiment_label,
            r.subjectivity, r.readability_grade, r.word_count, r.reading_time,
            r.key_phrases, r.ai_summary, r.created_at,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=emoticore_history.csv"},
    )


@app.get("/history/{user_id}", response_model=List[schemas.InsightResponse], tags=["History"])
def get_history(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Retrieve analysis history for a specific user ID or all recent."""
    records = (
        db.query(models.InsightRecord)
        .filter((models.InsightRecord.owner_id == user_id) | (models.InsightRecord.owner_id == None))
        .order_by(models.InsightRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


@app.get("/history/{user_id}/export", tags=["History"])
def export_user_history_csv(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Download user analysis history as a CSV file."""
    records = (
        db.query(models.InsightRecord)
        .filter((models.InsightRecord.owner_id == user_id) | (models.InsightRecord.owner_id == None))
        .order_by(models.InsightRecord.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Text (Preview)", "Sentiment Score", "Sentiment Label",
        "Subjectivity", "Readability Grade", "Word Count", "Reading Time (min)",
        "Key Phrases", "AI Summary", "Created At",
    ])
    for r in records:
        writer.writerow([
            r.id, r.original_text, r.sentiment_score, r.sentiment_label,
            r.subjectivity, r.readability_grade, r.word_count, r.reading_time,
            r.key_phrases, r.ai_summary, r.created_at,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=emoticore_history_{user_id}.csv"},
    )


# ---------------------------------------------------------------------------
# Routes — Admin (protected by X-Admin-Key header)
# ---------------------------------------------------------------------------

@app.get("/admin/users", tags=["Admin"])
def get_all_users(
    x_admin_key: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """List all registered users. Requires X-Admin-Key header."""
    verify_admin(x_admin_key)
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username} for u in users]
