import os
import io
import re
import json
import PyPDF2
import textstat
from textblob import TextBlob

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text

def analyze_text_input(text: str):
    """
    Universal Deep Semantic Intelligence Engine.
    Uses LLM transformer reasoning to evaluate nuanced sentiment, sarcasm,
    technical trade-offs, and emotional valence across all domains.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    
    # ── 1. Primary Engine: Universal LLM Semantic Analysis ────────────────────
    if groq_api_key and groq_api_key.strip():
        for model_name in ["openai/gpt-oss-20b", "llama-3.3-70b-versatile", "qwen/qwen3.6-27b", "groq/compound-mini"]:
            try:
                from groq import Groq
                client = Groq(api_key=groq_api_key)
                
                prompt = (
                    "Evaluate the following text for nuanced emotional valence and tone. "
                    "Return ONLY a valid JSON object with EXACTLY these keys:\n"
                    '{\n'
                    '  "sentiment_score": <float between -1.0 and 1.0, where -1.0 is extremely negative, 0.0 is neutral, and 1.0 is positive>,\n'
                    '  "sentiment_label": <exactly "Positive", "Negative", or "Neutral">,\n'
                    '  "subjectivity": <float between 0.0 (pure fact) and 1.0 (pure opinion)>,\n'
                    '  "ai_summary": <1-sentence analytical overview followed by 1 actionable takeaway>\n'
                    '}\n\n'
                    f'Text to evaluate:\n"{text[:2500]}"'
                )

                response = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are Emoticore Precision Sentiment Engine. You always output raw JSON without code fences or extra text.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    model=model_name,
                    max_tokens=350,
                )
                
                raw = response.choices[0].message.content.strip()
                # Parse JSON block
                json_match = re.search(r'\{.*\}', raw, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    score = float(parsed.get("sentiment_score", 0.0))
                    score = max(-1.0, min(1.0, round(score, 2)))
                    
                    label = str(parsed.get("sentiment_label", "Neutral")).capitalize()
                    if label not in ["Positive", "Negative", "Neutral"]:
                        label = "Positive" if score > 0.08 else "Negative" if score < -0.08 else "Neutral"
                    
                    subj = float(parsed.get("subjectivity", 0.5))
                    subj = max(0.0, min(1.0, round(subj, 2)))
                    
                    summary = str(parsed.get("ai_summary", "")).strip()
                    if summary:
                        summary = re.sub(r'<think>.*?(?:</think>|$)', '', summary, flags=re.DOTALL).strip()

                    blob = TextBlob(text)
                    return {
                        "sentiment_score": score,
                        "sentiment_label": label,
                        "subjectivity": subj,
                        "readability_grade": textstat.text_standard(text),
                        "word_count": len(text.split()),
                        "reading_time": round(len(text.split()) / 200, 2),
                        "key_phrases": ", ".join(list(set(blob.noun_phrases))[:3]) or "General Content",
                        "ai_summary": summary or f"Processed input with sentiment valence {score:+.2f}."
                    }
            except Exception:
                continue

    # ── 2. Fallback Engine: High-Precision Lexical Analysis ───────────────────
    lower = text.lower()
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    strong_neg = ['crashed', 'crash', 'unreachable', 'outage', 'downtime', 'ruined', 'refund', 'catastrophic', 'unresponsive', 'broken', 'worst', 'terrible', 'horrible', 'awful', 'failed', 'failure']
    mod_neg = ['slow', 'laggy', 'delay', 'delayed', 'complaint', 'issue', 'bug', 'error', 'poor', 'annoying', 'frustrating', 'disappointed']
    strong_pos = ['outstanding', 'exceptional', 'superb', 'flawless', 'breakthrough', 'magnificent', 'love', 'loved', 'fantastic', 'brilliant', 'perfect']
    mod_pos = ['great', 'good', 'sleek', 'clean', 'smooth', 'fluid', 'intuitive', 'fast', 'helpful', 'efficient', 'improved']

    neg_score = sum(0.40 for kw in strong_neg if re.search(r'\b' + re.escape(kw) + r'\b', lower)) + sum(0.18 for kw in mod_neg if re.search(r'\b' + re.escape(kw) + r'\b', lower))
    pos_score = sum(0.40 for kw in strong_pos if re.search(r'\b' + re.escape(kw) + r'\b', lower)) + sum(0.15 for kw in mod_pos if re.search(r'\b' + re.escape(kw) + r'\b', lower))

    if neg_score > 0 or pos_score > 0:
        lex_adjustment = max(-1.0, min(1.0, pos_score - neg_score))
        final_score = (polarity * 0.3) + (lex_adjustment * 0.7)
    else:
        final_score = polarity

    final_score = max(-1.0, min(1.0, round(final_score, 2)))
    label = "Positive" if final_score > 0.08 else "Negative" if final_score < -0.08 else "Neutral"
    
    first_sentence = str(blob.sentences[0]).strip() if blob.sentences else "Content"
    if len(first_sentence) > 160:
        first_sentence = first_sentence[:157] + "..."
    tone = "positive engagement" if final_score > 0.08 else "critical tone requiring attention" if final_score < -0.08 else "neutral tone"

    return {
        "sentiment_score": final_score,
        "sentiment_label": label,
        "subjectivity": round(subjectivity, 2),
        "readability_grade": textstat.text_standard(text),
        "word_count": len(text.split()),
        "reading_time": round(len(text.split()) / 200, 2),
        "key_phrases": ", ".join(list(set(blob.noun_phrases))[:3]) or "General Content",
        "ai_summary": f'Key extract: "{first_sentence}" — Reflects {tone}.'
    }


