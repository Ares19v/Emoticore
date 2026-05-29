# EVAL - Emoticore

> **Evaluation Date:** 2026-05-29  
> **Evaluator:** Automated Portfolio Review  
> **Maturity Level:** Production-Ready / High MVP

---

## 1. Project Purpose & Problem Statement

Knowledge workers, researchers, and administrators are inundated with massive volumes of raw text and multi-page PDF documents. Quickly extracting both cold quantitative metadata (readability grade levels, word counts, sentiment polarity, opinion subjectivity) and semantic summaries is a highly repetitive task. Emoticore solves this by integrating classical deterministic Natural Language Processing (TextBlob, Textstat) with an ultra-fast Generative AI summary pipeline powered by Groq and LLaMA 3.

The target audience is developers and data analysts who require a lightweight, production-deployed intelligence dashboard to run high-speed text triage, generate styled PDF reports, and export raw data without hitting heavy GPU infrastructure costs locally.

---

## 2. Technical Architecture

Emoticore is structured as a decoupled full-stack platform:

**Frontend (`frontend/`):** React 19 + Vite + Tailwind CSS 4. Uses React Router 7 for route orchestration and Zustand/local state for session management. Includes Recharts for telemetry visualizations, Axios for backend queries, and `jsPDF` for client-side formatted PDF report generation. Deployed on Vercel CDN.

**Backend (`backend/`):** FastAPI (Python 3.10+) serving a REST API. Employs SQLAlchemy 2.0 ORM with a local SQLite database file (`internal_audit.db`). Deployed on Render.com.

**Analysis Pipeline:**
1. **Extraction:** PyPDF2 parses binary streams from multi-file uploads into plain text strings.
2. **Deterministic NLP:**
   - **TextBlob:** Extracts sentiment polarity (`-1.0` to `+1.0`), subjectivity (`0.0` to `1.0`), and noun phrases.
   - **Textstat:** Evaluates reading readability index (Flesch-Kincaid Grade Level).
3. **Generative AI:** The Groq SDK dispatches the text payload to `llama3-8b-8192` with strict system instructions, yielding a 1-sentence executive summary and a suggested action.
4. **Persistence:** Serializes the complete insight record to SQLite.

**Security:**
- Bcrypt-hashed passwords (cost factor 12) via Passlib.
- PyJWT issuing secure, signed tokens with a 7-day expiration.
- Custom `X-Admin-Key` header checking for the developer metrics panel.

---

## 3. Model/Algorithm Details

Emoticore blends traditional heuristics with third-party LLM inference:
- **TextBlob Sentiment Analyzer:** Utilizes a rule-based lexicon classifier mapping words to polarity and subjectivity scores. Extremely fast and lightweight, running synchronously on standard CPU threads.
- **Textstat Readability:** Employs standard linguistic formulas (Flesch-Kincaid Grade, Gunning Fog) based on syllable, word, and sentence counts.
- **LLaMA 3 (8B) via Groq:** Zero-shot summarization executed on Groq's low-latency LPU (Language Processing Unit) architecture.

*Note: Since the platform leverages hosted APIs (Groq) and standard CPU-bound libraries (TextBlob, Textstat), there are no custom local model weights to download.*

---

## 4. Strengths

- **Fully Deployed Pipeline:** Unlike raw local scripts, Emoticore is genuinely deployed (Vercel CDN + Render.com) with real live links.
- **Hybrid NLP Approach:** Using lightweight classical NLP for metrics (sentiment, readability) and reserving LLMs for the synthesis step is an excellent cost-effective design pattern.
- **Rich Document Exports:** Highly polished client-side jsPDF report generation and one-click CSV batch history exports provide instant business utility.
- **Robust Auth & Security:** Signed JWT tokens with a 7-day expiry and bcrypt hashing provide standard web application security.
- **Developer Metrics & Admin Panel:** An `X-Admin-Key` gated panel enables backend monitoring of user volume and system throughput.
- **CI/CD Quality:** GitHub Actions automatically tests the FastAPI backend using `pytest` (25 API tests covering all routes) and validates the React compilation on every push.
- **Windows Automation:** Comprehensive batch files (`install.bat`, `Run_Project.bat`, `uninstall.bat`) make local setup effortless.

---

## 5. Limitations & Known Gaps

- **SQLite Persistence:** The roadmap lists migrating to PostgreSQL as a future step. A shared SQLite file on Render will reset or corrupt if the container spins down or scales horizontally.
- **Synchronous PyPDF2 Processing:** PyPDF2 handles extractions synchronously on the main ASGI event loop. Large or complex PDFs will block the API worker, potentially causing timeouts.
- **No Background Task Queue:** Lacks Celery or Redis for handling large multi-file uploads asynchronously.
- **In-Memory Rate Limiting:** Rate limit guards are absent from key endpoints, making the backend vulnerable to automated brute-force attacks.
- **No Local Fallback:** The summarization pipeline depends entirely on a valid `GROQ_API_KEY`, lacking an offline fallback model option (e.g. Hugging Face local transformers).

---

## 6. Code Quality Assessment

**Structure:** Clean directory organization separating frontend components from backend routers. Pydantic models in `schemas.py` enforce strict validation on input form-data.

**Documentation:** Thorough. The README features detailed feature tables, architecture diagrams, API request/response specifications, and a clear roadmap.

**Tests:** Excellent test coverage in `backend/tests/` (25 distinct tests using pytest) validating auth, CRUD operations, and extraction routes.

**CI/CD:** Well-configured automated actions guaranteeing linting and testing passes before staging builds.

---

## 7. Maturity Breakdown

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Multi-format uploads, exports, JWT, charts, and admin metrics work perfectly |
| Code Quality | 8/10 | Clear separation of concerns; great test coverage (25 tests) |
| Documentation | 9/10 | Exceptional documentation with API specifications and flow diagrams |
| Scalability | 5/10 | SQLite database and synchronous PyPDF2 block horizontal scaling |
| Security | 7/10 | Bcrypt and JWT are solid; needs database rate-limiting and robust CORS config |
| **Overall** | **7.6/10** | **Polished, fully deployed full-stack NLP pipeline; database upgrade is key** |

---

## 8. Suggested Next Steps

1. **Migrate to PostgreSQL:** Replace the local SQLite file with a hosted PostgreSQL instance (e.g. Supabase or RDS) to enable secure persistence across container restarts on Render.
2. **Implement Asynchronous Queue (Celery/Redis):** Offload PDF parsing and Groq API summarization to background tasks, allowing the API to return instant processing IDs and maintain high concurrency.
3. **Add Rate-Limiter (SlowAPI):** Add rate-limiting on `/login`, `/register`, and `/analyze` to prevent API key depletion and brute-force vectors.

---

## 9. Verdict

Emoticore is a highly polished and professional full-stack NLP dashboard. By utilizing a hybrid NLP strategy (classical rule-based TextBlob for metrics and LLaMA 3 for summaries), it balances low latency, high accuracy, and operational affordability. The CI/CD test suite, multi-file PDF extraction, and client-side jsPDF reports make this a complete, deployable SaaS MVP. Migrating SQLite to PostgreSQL and implementing background workers for large PDF extractions are the only key architectural changes needed to make it a fully enterprise-ready solution.

---
<p align="center">Made by Devansh Tyagi @ 2026</p>
