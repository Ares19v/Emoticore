<div align="center">

# Emoticore — Intelligence Engine


[![CI](https://github.com/Ares19v/Emoticore/actions/workflows/ci.yml/badge.svg)](https://github.com/Ares19v/Emoticore/actions/workflows/ci.yml)

### *Transform text and documents into actionable insights, powered by NLP and Groq AI*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Frontend-7C3AED?style=for-the-badge)](https://Emoticore-gilt-iota.vercel.app)
[![API Status](https://img.shields.io/badge/🚀_API-Backend_Live-10B981?style=for-the-badge)](https://Emoticore-backend-e4iz.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)


<br/>

> **Emoticore** is a production-deployed, full-stack intelligence platform that converts raw text and PDF documents into deep analytical insights — combining classical NLP scoring with a live LLM-powered AI summary engine (via Groq + LLaMA 3).

<br/>


</div>


## 📌 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🧠 How It Works](#-how-it-works)
- [🛠️ Tech Stack](#️-tech-stack)
- [📡 API Reference](#-api-reference)
- [💻 Local Setup](#-local-setup)
- [🚀 Deployment](#-deployment)
- [📁 Project Structure](#-project-structure)
- [🔮 Roadmap](#-roadmap)

---

## ✨ Features

| Feature | Description |
|---|---|
| **🧠 NLP Analysis Engine** | Scores text for Sentiment Polarity (`-1.0 → +1.0`), Subjectivity (Fact vs. Opinion), and Readability Grade Level |
| **🤖 AI Summary (Groq + LLaMA 3)** | Each analysis is enhanced with a 1-sentence LLM summary and a suggested action, powered by the Groq API |
| **📄 PDF Intelligence** | Upload one or multiple PDF documents; Emoticore extracts and analyzes the full text automatically |
| **📊 Animated Telemetry Dashboard** | Interactive React dashboard with animated Recharts data visualizations and real-time score cards |
| **📥 PDF Report Export** | Generate and download branded, formatted PDF reports of any analysis result using `jsPDF` |
| **📤 CSV Export** | Download your complete analysis history as a spreadsheet with one click |
| **🔐 JWT Authentication** | Secure account system with bcrypt-hashed passwords and signed JWT access tokens (7-day expiry) |
| **👤 User Registry & History** | Persistent analysis history per user, stored in SQLite via SQLAlchemy ORM |
| **🛡️ Admin Panel** | Hidden developer view with `X-Admin-Key` header protection for monitoring system-wide metrics |
| **🐳 Docker Support** | Fully containerized with `Dockerfile` and `docker-compose.yml` for one-command local deployment |
| **✅ CI/CD Pipeline** | GitHub Actions runs the full pytest suite and frontend build on every push to `main` |
| **🌐 Production Deployed** | Frontend on Vercel, backend on Render — live and accessible at all times |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Emoticore v5.0 Pro                            │
│                      Full-Stack Intelligence Engine                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┴────────────────────────┐
          │                                                  │
   ┌──────▼──────┐                                  ┌───────▼──────┐
   │   FRONTEND   │                                  │   BACKEND    │
   │  React + Vite │                                  │   FastAPI    │
   │  Vercel CDN   │◄────── REST API (JSON) ─────────►  Render.com  │
   └──────────────┘                                  └──────┬───────┘
                                                            │
              ┌─────────────────────────────────────────────┤
              │                                             │
       ┌──────▼──────┐                            ┌────────▼────────┐
       │  NLP Engine  │                            │  Groq API       │
       │  TextBlob    │                            │  LLaMA 3 8B     │
       │  Textstat    │                            │  AI Summarizer  │
       │  PyPDF2      │                            └────────┬────────┘
       └──────┬───────┘                                     │
              │                                             │
       ┌──────▼──────────────────────────────────────────── ▼──────┐
       │                    SQLite Database                         │
       │              (SQLAlchemy ORM + Pydantic)                   │
       │         Users Table   ◄──────►   InsightRecords Table      │
       └────────────────────────────────────────────────────────────┘
```

---

## 🧠 How It Works

Every text or PDF submitted to Emoticore flows through a **multi-stage analysis pipeline**:

```
User Input (Text / PDF Upload)
         │
         ▼
  ┌─────────────┐
  │  PDF Parser  │  ← PyPDF2 extracts raw text from uploaded documents
  └──────┬──────┘
         │
         ▼
  ┌───────────────────────────────────────────────────────┐
  │                  NLP Processor                        │
  │                                                       │
  │  TextBlob   → Sentiment Polarity & Subjectivity       │
  │  Textstat   → Readability Grade (Flesch-Kincaid)      │
  │  TextBlob   → Noun Phrase Extraction (Key Phrases)    │
  │  Python     → Word Count & Reading Time (WPM/200)     │
  └──────────────────────────┬────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Groq API (LLaMA 3) │
                  │   AI Summary +       │
                  │   Suggested Action   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  SQLite Persistence  │
                  │  (InsightRecord)     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  React Dashboard     │
                  │  Recharts + jsPDF    │
                  └──────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology | Version |
|---|---|---|
| Web Framework | FastAPI | 0.135 |
| ORM | SQLAlchemy | 2.0 |
| Database | SQLite | — |
| Data Validation | Pydantic | 2.x |
| NLP — Sentiment | TextBlob | 0.20 |
| NLP — Readability | Textstat | 0.7 |
| PDF Parsing | PyPDF2 | 3.0 |
| AI Summarization | Groq SDK (LLaMA 3 8B) | Latest |
| Server | Uvicorn (ASGI) | 0.44 |

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Build Tool | Vite | 8 |
| Routing | React Router DOM | 7 |
| Styling | Tailwind CSS | 4 |
| Charts | Recharts | 3 |
| HTTP Client | Axios | 1.14 |
| PDF Export | jsPDF | 4 |
| Icons | Lucide React | 1.7 |

### Infrastructure
| Service | Provider |
|---|---|
| Frontend Hosting | Vercel (CDN + CI/CD) |
| Backend Hosting | Render.com |
| AI API | Groq Cloud |

---

## 📡 API Reference

**Base URL:** `https://Emoticore-backend-e4iz.onrender.com`

### `GET /`
> Health check — returns API status.

**Response:**
```json
{ "status": "Online" }
```

---

### `POST /register`
> Create a new user account.

**Request Body:**
```json
{ "username": "devansh", "password": "securepassword" }
```

**Response:** `201` — User object with `id` and `username`.

---

### `POST /login`
> Authenticate a user.

**Request Body:**
```json
{ "username": "devansh", "password": "securepassword" }
```

**Response:** `200` — User object with `id`.

---

### `POST /analyze`
> Submit text or PDF files for full NLP analysis + AI summary.

**Form Data:**
| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | `int` | ✅ | Authenticated user's ID |
| `original_text` | `string` | ⚠️ | Plain text input (if no file) |
| `files` | `File[]` | ⚠️ | One or more PDF uploads |

**Response:**
```json
{ "status": "Complete", "count": 1 }
```

---

### `GET /history/{user_id}`
> Retrieve all past analyses for a user.

**Response:** Array of `InsightRecord` objects:
```json
[
  {
    "id": 1,
    "original_text": "...",
    "sentiment_score": 0.35,
    "sentiment_label": "Positive",
    "subjectivity": 0.48,
    "readability_grade": "8th and 9th grade",
    "word_count": 312,
    "reading_time": 1.56,
    "key_phrases": "machine learning, data pipeline",
    "ai_summary": "The text discusses ML workflows. Action: High Priority Review.",
    "created_at": "2026-04-25T10:00:00Z"
  }
]
```

---

### `GET /admin/users`
> *(Developer Only)* List all registered users.

---

## 💻 Local Setup

### Prerequisites
- Python **3.10+**
- Node.js **18+**
- A free [Groq API Key](https://console.groq.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Ares19v/Emoticore.git
cd Emoticore
```

---

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt

# Download required NLTK corpora
python download_data.py

# Set your Groq API key (Windows PowerShell)
$env:GROQ_API_KEY="your_groq_api_key_here"

# Set your Groq API key (macOS/Linux)
export GROQ_API_KEY="your_groq_api_key_here"

# Start the API server
uvicorn app.main:app --reload
```

Backend will be running at **`http://localhost:8000`**
Interactive API docs available at **`http://localhost:8000/docs`**

---

### 3. Frontend Setup

```bash
# Navigate to frontend (from the project root)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be running at **`http://localhost:5173`**

> **Note:** By default, the frontend points to the live Render backend. To use your local backend, update the API base URL in `src/App.jsx`.

---

## 🚀 Deployment

### Backend → Render

The `render.yaml` in the `backend/` directory contains the full deployment configuration.

1. Connect your GitHub repository to [Render.com](https://render.com)
2. Render auto-detects `render.yaml` and configures the service
3. Add your `GROQ_API_KEY` as an **Environment Variable** in the Render dashboard
4. Deploy — Render handles build and start commands automatically

**Build Command:** `pip install -r backend/requirements.txt`
**Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`

### Frontend → Vercel

1. Import the repository into [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Vercel auto-detects Vite and deploys on every push to `main`

---

## 📁 Project Structure

```
Emoticore/
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions — pytest + frontend build on every push
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py          # bcrypt hashing + JWT creation/verification + auth dependency
│   │   ├── crud.py          # Reusable database query helpers
│   │   ├── database.py      # SQLAlchemy engine, session factory, DeclarativeBase
│   │   ├── main.py          # FastAPI entry point — all routes & middleware
│   │   ├── models.py        # ORM models (User, InsightRecord)
│   │   ├── processor.py     # NLP pipeline + Groq AI summarizer
│   │   └── schemas.py       # Pydantic schemas — request/response validation
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py      # Pytest fixtures, test env vars, DB cleanup
│   │   └── test_api.py      # Full API test suite (25 tests across all routes)
│   │
│   ├── .dockerignore        # Prevents secrets/venv/cache from entering Docker image
│   ├── .env.example         # Environment variable template
│   ├── Dockerfile           # Python 3.11-slim production image
│   ├── download_data.py     # NLTK corpus downloader script
│   ├── render.yaml          # Render.com deployment configuration
│   └── requirements.txt     # Pinned Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React app — JWT auth, dashboard, all views
│   │   ├── App.css          # Custom scrollbar utility
│   │   ├── index.css        # Global Tailwind CSS
│   │   └── main.jsx         # React DOM entry point
│   ├── .env.example         # Frontend environment variable template
│   ├── Dockerfile           # Multi-stage nginx production image
│   ├── index.html           # HTML shell with SEO meta tags
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite + Tailwind build config
│
├── .gitignore               # Excludes .env, *.db, node_modules/, venv/
├── CONTRIBUTING.md          # Contribution guide
├── docker-compose.yml       # One-command local stack (backend + frontend)
├── install.bat              # One-click dependency installer (Windows)
├── Run_Project.bat          # One-click launcher — starts both services + browser
├── LICENSE                  # MIT
├── README.md
├── SECURITY.md              # Security policy & responsible disclosure
└── uninstall.bat            # One-click cleanup to free disk space
```

---

## 🔮 Roadmap

- [x] **JWT Authentication** — Bcrypt-hashed passwords, signed JWT tokens (7-day expiry), protected routes
- [x] **CSV Export** — Download full analysis history as a spreadsheet
- [x] **Docker Support** — Containerized with Dockerfile + docker-compose
- [x] **CI/CD Pipeline** — GitHub Actions runs tests + build on every push
- [ ] **Batch Processing Queue** — Background job queue for large multi-PDF uploads
- [ ] **PostgreSQL Migration** — Swap SQLite for a high-performance PostgreSQL database
- [ ] **Tone Classification** — Multi-label emotional tone tagging (e.g., Anger, Joy, Urgency)
- [ ] **Dark Mode Toggle** — User-preference-aware theme switching

---

<div align="center">

**Built by [Devansh Tyagi](https://github.com/Ares19v)**

*If you found this project useful, consider giving it a ⭐*

</div>

---

© 2025 Devansh Tyagi (Ares19v). All Rights Reserved.
