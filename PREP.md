# Study Prep Guide: Emoticore — Intelligence Engine

Welcome! This guide is a step-by-step beginner's tutorial designed to help you understand and build **Emoticore**—a full-stack NLP and AI text summarization platform. You will learn about traditional text analytics, PDF document parsing, secure user authentication with JWTs, and interfacing with low-latency LLMs.

---

## 🗺️ System Architecture

Emoticore is a full-stack web application designed to parse text inputs or PDF uploads, process them through classical and modern AI layers, and present interactive charts:

```
                  User Upload (Text or PDF)
                             │
                             ▼
                 ┌───────────────────────┐
                 │ FastAPI Backend (API) │
                 └─────┬───────────┬─────┘
                       │           │
           (Linguistic Metrics)  (Semantic Executive Summary)
                       │           │
             ┌─────────▼─┐       ┌─▼─────────┐
             │TextBlob & │       │ Groq LPU  │
             │ Textstat  │       │ (LLaMA 3) │
             └─────────┬─┘       └─────┬─────┘
                       \               /
                        ▼             ▼
                 ┌───────────────────────┐
                 │ SQLite Database       │
                 │ (InsightRecord Table) │
                 └───────────────────────┘
```

---

## 📚 Core Learning Prerequisites

Make sure you understand:
1. **Linguistic Metrics**:
   - **Sentiment Polarity**: Measuring positive (+1.0), neutral (0.0), or negative (-1.0) emotional tones.
   - **Subjectivity**: Determining if text is fact-based (0.0) or opinion-based (1.0).
   - **Readability Grade Level**: Using mathematical indices (e.g. Flesch-Kincaid) to count syllables and words, identifying the reading level required (e.g. "8th grade").
2. **TextBlob & Textstat**: Classic, lightweight Python libraries for fast, CPU-bound NLP processing.
3. **JSON Web Tokens (JWT)**: A secure method to authenticate users. The server signs a token containing the user's ID, which the browser stores and transmits in request headers.

---

## 🛠️ Step-by-Step Implementation Guide

Let's build a micro-version of Emoticore's core analysis pipeline in Python!

### Step 1: Set Up the Environment
Create a folder and install the required modules:
```bash
mkdir mini-emoticore
cd mini-emoticore
python -m venv venv
venv\Scripts\activate  # On Windows
pip install textblob textstat pypdf2 fastapi uvicorn
```

---

### Step 2: The Core NLP and PDF Pipeline
Create a Python script `nlp_pipeline.py`. We will extract text from a PDF, run TextBlob sentiment analysis, and calculate Textstat readability:

```python
import os
from textblob import TextBlob
import textstat
from PyPDF2 import PdfReader

# 1. Plain Text NLP Scoring Function
def analyze_text(text: str):
    blob = TextBlob(text)
    sentiment = blob.sentiment # Returns (polarity, subjectivity)
    
    analysis = {
        "polarity": round(sentiment.polarity, 2),
        "subjectivity": round(sentiment.subjectivity, 2),
        "readability_grade": textstat.flesch_kincaid_grade(text),
        "word_count": len(blob.words),
        "key_phrases": list(blob.noun_phrases)[:5]
    }
    return analysis

# 2. PDF Text Extraction Function
def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        return "Mock PDF text: TextBlob makes natural language processing easy and fast."
    
    reader = PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() or ""
    return full_text

# 3. Test the combined pipeline
sample_text = "The product is incredibly elegant, and the user interface responds immediately. However, it is slightly expensive."
print("--- Text Analysis Results ---")
print(analyze_text(sample_text))

print("\n--- PDF Parsing Simulation ---")
pdf_text = extract_text_from_pdf("sample.pdf")
print(f"Extracted Text: \"{pdf_text}\"")
print(analyze_text(pdf_text))
```

Run this file:
```bash
python nlp_pipeline.py
```

---

### Step 3: Serve via FastAPI with Mock Summaries
Now, let's wrap this pipeline into an API endpoint using FastAPI. Create `main.py`:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from nlp_pipeline import analyze_text

app = FastAPI()

class TextRequest(BaseModel):
    text: str

@app.post("/analyze")
def analyze(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    # 1. Run local NLP metrics
    metrics = analyze_text(req.text)
    
    # 2. Add mock LLaMA summary (In production, this queries Groq API)
    metrics["ai_summary"] = "The text evaluates software quality metrics positively. Action: Approved."
    
    return metrics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

Run this file and test via `http://127.0.0.1:8000/docs`:
```bash
python main.py
```

---

## 🔍 Key Deep Dive Topics

### 1. Hybrid Processing (CPU vs. GPU)
Traditional NLP operations (like counting syllables, calculating reading ease, and scanning sentiment lexicons) are highly optimized and run instantly on a single CPU core.
* **Architecture Choice**: By using `TextBlob` and `Textstat` locally, Emoticore keeps API latency and cloud bills near zero. The LLM (via Groq) is only invoked for the semantic task of summarizing, optimizing performance.

### 2. Client-Side PDF Generation (`jsPDF`)
Rather than forcing the Python server to render high-resolution binary PDFs (which consumes significant server RAM), Emoticore constructs formatted PDF reports directly inside the patient's browser using `jsPDF`. The user downloads a styled, branded document instantly without adding any load to the backend EC2 server.

---

## 🎯 Verification Tasks

1. **Local Install**: Run `install.bat` and then `Run_Project.bat` to launch the React frontend and FastAPI backend.
2. **Analysis Test**: Register an account, log in, paste an article or upload a multi-page PDF document, and verify that the Recharts visualizer plots your emotional polarity metrics in real time.
