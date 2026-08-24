from textblob import TextBlob
import PyPDF2
import io
import textstat
import os

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text

def get_ai_summary(text: str) -> str:
    """Generate a high-signal action summary with Groq LLM, with robust local fallback."""
    import re
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key and groq_api_key.strip():
        for model_name in ["openai/gpt-oss-20b", "qwen/qwen3.6-27b", "groq/compound-mini"]:
            try:
                from groq import Groq
                client = Groq(api_key=groq_api_key)
                response = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are Emoticore Intelligence Engine. Provide a direct 1-sentence analytical overview followed by 1 actionable takeaway.",
                        },
                        {"role": "user", "content": f"Analyze this text: {text[:2000]}"},
                    ],
                    model=model_name,
                    max_tokens=350,
                )
                content = response.choices[0].message.content
                if content and content.strip():
                    cleaned = re.sub(r'<think>.*?(?:</think>|$)', '', content, flags=re.DOTALL).strip()
                    if cleaned and len(cleaned) > 10:
                        return cleaned
            except Exception:
                continue

    # Local heuristic summary fallback (zero external dependencies)
    blob = TextBlob(text)
    sentences = blob.sentences
    if not sentences:
        return "Insight generated from input content."
    first_sentence = str(sentences[0]).strip()
    if len(first_sentence) > 160:
        first_sentence = first_sentence[:157] + "..."
    polarity = blob.sentiment.polarity
    tone = "positive sentiment and strong engagement" if polarity > 0.15 else "critical tone requiring attention" if polarity < -0.15 else "neutral/objective tone"
    return f"Key extract: \"{first_sentence}\" — Reflects {tone}."

def analyze_text_input(text: str):
    import re
    lower = text.lower()
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    # High-signal domain lexicon for software, technical services, and customer feedback
    strong_neg = [
        'crashed', 'crash', 'crashing', 'unreachable', 'outage', 'downtime', 'ruined',
        'refund', 'refunds', 'catastrophic', 'unresponsive', 'broken', 'worst', 'terrible',
        'horrible', 'awful', 'fraud', 'scam', 'buggy', 'hacked', 'disaster', 'failed',
        'failing', 'failure', 'lost data', 'data loss', 'down for hours', 'unusable'
    ]
    mod_neg = [
        'slow', 'laggy', 'delay', 'delayed', 'complaint', 'complaints', 'issue', 'issues',
        'bug', 'bugs', 'error', 'errors', 'glitch', 'poor', 'annoying', 'frustrating',
        'frustrated', 'disappointed', 'dissatisfied', 'bad', 'hard to use'
    ]
    strong_pos = [
        'outstanding', 'exceptional', 'superb', 'flawless', 'breakthrough', 'magnificent',
        'love', 'loved', 'fantastic', 'brilliant', 'incredible', 'perfect', 'game changer', 'top tier'
    ]
    mod_pos = [
        'great', 'good', 'sleek', 'clean', 'smooth', 'fluid', 'intuitive', 'fast',
        'helpful', 'pleasure', 'efficient', 'improved', 'awesome', 'impressive'
    ]

    neg_score = 0.0
    for kw in strong_neg:
        if re.search(r'\b' + re.escape(kw) + r'\b', lower):
            neg_score += 0.45
    for kw in mod_neg:
        if re.search(r'\b' + re.escape(kw) + r'\b', lower):
            neg_score += 0.20

    pos_score = 0.0
    for kw in strong_pos:
        if re.search(r'\b' + re.escape(kw) + r'\b', lower):
            pos_score += 0.40
    for kw in mod_pos:
        if re.search(r'\b' + re.escape(kw) + r'\b', lower):
            pos_score += 0.15

    if neg_score > 0 or pos_score > 0:
        lex_adjustment = max(-1.0, min(1.0, pos_score - neg_score))
        final_score = (polarity * 0.3) + (lex_adjustment * 0.7)
    else:
        final_score = polarity

    final_score = max(-1.0, min(1.0, round(final_score, 2)))
    label = "Positive" if final_score > 0.08 else "Negative" if final_score < -0.08 else "Neutral"

    return {
        "sentiment_score": final_score,
        "sentiment_label": label,
        "subjectivity": round(subjectivity, 2),
        "readability_grade": textstat.text_standard(text),
        "word_count": len(text.split()),
        "reading_time": round(len(text.split()) / 200, 2),
        "key_phrases": ", ".join(list(set(blob.noun_phrases))[:3]) or "General Content",
        "ai_summary": get_ai_summary(text)
    }

