import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMMA_ENDPOINT = os.getenv("GEMMA_ENDPOINT")
GEMMA_TOKEN = os.getenv("GEMMA_TOKEN")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "google/gemma-3-27b-it")

if not GEMMA_ENDPOINT or not GEMMA_TOKEN:
    raise ValueError("Missing GEMMA_ENDPOINT or GEMMA_TOKEN. Copy .env.example to .env and fill in values.")

response = httpx.post(
    f"{GEMMA_ENDPOINT}/v1/completions",
    headers={
        "Authorization": f"Bearer {GEMMA_TOKEN}",
        "Content-Type": "application/json"
    },
    json={
        "model": GEMMA_MODEL,
        "prompt": "Say hello briefly.",
        "max_tokens": 50
    },
    timeout=30
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
