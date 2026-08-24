import urllib.request, urllib.parse, json, time

sentences = [
    ('Sarcastic Frustration', 'Oh fantastic, another mandatory update that broke everything that was working completely fine.'),
    ('High Product Delight', 'This is hands down the most intuitive developer tool I have used all year, saved our team countless hours!'),
    ('Pure Technical Fact', 'The WebSeocket server listens on port 8080 and handles TCP connection handshakes via RFC 6455.'),
    ('Passive-Aggressive Email', 'Per my previous three emails, we are still waiting on the deliverables that were promised last Tuesday.'),
    ('Balanced Mixed Review', 'The visual design is breathtaking and modern, but the onboarding tutorial is confusing for first-time users.'),
    ('Legal Disclaimer', 'The licensee agrees to indemnify and hold harmless the licensor from any third-party claims or damages.'),
    ('Critical Security Alert', 'Critical vulnerability detected: unauthorized access attempt bypassed our authentication gateway.'),
    ('Lukewarm Indifference', 'It gets the job done for basic tasks, nothing to write home about.')
]

print('=' * 115)
print('          EMOTICORE UNIVERSAL SEMANTIC INTELLIGENCE LIVE EVALUATION')
print('=' * 115)

for i, (category, text) in enumerate(sentences, 1):
    print(f'Testing [{i}/8]: {category}...')
    data = urllib.parse.urlencode({'original_text': text}).encode('utf-8')
    req = urllib.request.Request('http://localhost:8000/analyze', data=data, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    with urllib.request.urlopen(req) as resp:
        pass

req = urllib.request.Request(f'http://localhost:8000/history?limit={len(sentences)}')
with urllib.request.urlopen(req) as resp:
    records = json.loads(resp.read().decode())

print()
print('Category                 | Sentiment | Score  | Subj  | AI Key Takeaway')
print('-' * 115)
for (cat, original), r in zip(sentences, reversed(records[:len(sentences)])):
    ai_preview = (r.get('ai_summary') or '').replace('\\n', ' ')
    if len(ai_preview) > 65:
        ai_preview = ai_preview[:62] + '...'
    print(f"{cat:<24} | {r['sentiment_label']:<9} | {r['sentiment_score']:<6} | {r['subjectivity']:<5} | {ai_preview}")
print('=' * 115)
