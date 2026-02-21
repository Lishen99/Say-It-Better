"""
Say It Better - Backend API
An AI-powered emotional translation tool that helps people clearly express how they feel.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from dotenv import load_dotenv
import httpx
import json

# Load environment variables from .env file
load_dotenv()

# TELUS AI Endpoints (loaded from environment variables)
# See .env.example for setup instructions
GEMMA_ENDPOINT = os.getenv("GEMMA_ENDPOINT")
GEMMA_TOKEN = os.getenv("GEMMA_TOKEN")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "google/gemma-3-27b-it")

QWEN_EMB_ENDPOINT = os.getenv("QWEN_EMB_ENDPOINT")
QWEN_EMB_TOKEN = os.getenv("QWEN_EMB_TOKEN")
QWEN_EMB_MODEL = os.getenv("QWEN_EMB_MODEL", "Qwen/Qwen3-Embedding-8B")

# Validate required environment variables
if not GEMMA_ENDPOINT or not GEMMA_TOKEN:
    raise ValueError("Missing required environment variables: GEMMA_ENDPOINT and GEMMA_TOKEN. See .env.example for setup.")

app = FastAPI(
    title="Say It Better API",
    description="Transform raw emotional thoughts into clear, calm, neutral language",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class TranslationRequest(BaseModel):
    raw_text: str = Field(..., min_length=10, max_length=5000, description="Raw emotional text to translate")
    tone: Optional[str] = Field(default="neutral", description="Output tone: 'neutral', 'personal', or 'clinical'")

class ThemeItem(BaseModel):
    theme: str
    description: str

class TranslationResponse(BaseModel):
    summary: str
    themes: List[ThemeItem]
    share_ready: str
    original_length: int
    translated_length: int

class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to embed")

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]

class ThemeSimilarityRequest(BaseModel):
    current_themes: List[str] = Field(..., description="Themes from current translation")
    past_themes: List[str] = Field(..., description="Themes from past translations")

class ThemeSimilarityResponse(BaseModel):
    recurring_themes: List[str]
    similarity_scores: dict

class HealthResponse(BaseModel):
    status: str
    message: str

class ShareRequest(BaseModel):
    encrypted_data: str = Field(..., description="Base64 encoded encrypted JSON blob")
    iv: str = Field(..., description="Base64 encoded initialization vector")

class ShareResponse(BaseModel):
    share_id: str
    expires_at: str

class SharedAndEncryptedData(BaseModel):
    encrypted_data: str
    iv: str
    created_at: float
    expires_at: float


# System prompt - carefully designed to avoid therapy/diagnosis
SYSTEM_PROMPT = """You are a language assistant that helps people express their thoughts more clearly. Your ONLY purpose is to rewrite emotional or unstructured text into clear, neutral, respectful language.

STRICT RULES - YOU MUST FOLLOW THESE:
1. DO NOT give advice or suggestions
2. DO NOT diagnose or label mental health conditions
3. DO NOT assume intent or read between the lines
4. DO NOT act as a therapist, counselor, or medical professional
5. DO NOT use crisis intervention language
6. DO NOT add information that wasn't in the original text
7. ONLY rephrase and summarize what the user has written

Your output must be in valid JSON format with exactly this structure:
{
    "summary": "A clear, calm 2-4 sentence summary of what the person expressed",
    "themes": [
        {"theme": "Theme Name", "description": "Brief neutral description"},
        {"theme": "Theme Name", "description": "Brief neutral description"}
    ],
    "share_ready": "A polished, professional version suitable for sharing with a healthcare provider, therapist, or trusted person"
}

Remember: You are translating language, not analyzing minds. Keep themes factual and based only on what was explicitly stated."""


def get_tone_instruction(tone: str) -> str:
    """Return additional instructions based on desired tone."""
    if tone == "personal":
        return "\nUse first-person language and a warmer, more personal tone while remaining clear."
    elif tone == "clinical":
        return "\nUse precise, clinical language suitable for medical contexts."
    return "\nMaintain a balanced, neutral tone."


async def call_ai_model(raw_text: str, tone: str = "neutral") -> dict:
    """Call the Groq API (Llama 3.3 70B) to translate emotional text."""
    
    # Build the user prompt
    user_prompt = f"""Please rewrite the following text into clear, neutral language.
{get_tone_instruction(tone)}

Original text:
\"\"\"{raw_text}\"\"\"

Respond ONLY with valid JSON matching this exact structure:
{{
    "summary": "A clear, calm 2-4 sentence summary",
    "themes": [
        {{"theme": "Theme Name", "description": "Brief description"}},
        {{"theme": "Theme Name", "description": "Brief description"}}
    ],
    "share_ready": "A polished version suitable for sharing"
}}

JSON Response:"""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code != 200:
                print(f"API Error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=502, detail="AI service unavailable")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            # Handle potential markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            # Try to find JSON in the response
            content = content.strip()
            if not content.startswith("{"):
                # Find the first { and last }
                start = content.find("{")
                end = content.rfind("}") + 1
                if start != -1 and end > start:
                    content = content[start:end]
            
            return json.loads(content.strip())
            
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="Say It Better API is running. This tool helps translate emotional language - it does not provide therapy or medical advice."
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check."""
    return HealthResponse(
        status="healthy",
        message="All systems operational"
    )


@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translate raw emotional text into clear, neutral language.
    
    This endpoint does NOT:
    - Provide therapy or counseling
    - Diagnose mental health conditions
    - Give medical advice
    - Handle crisis situations
    
    It ONLY helps with language translation and clarification.
    """
    
    # Call AI model
    result = await call_ai_model(request.raw_text, request.tone)
    
    return TranslationResponse(
        summary=result["summary"],
        themes=[ThemeItem(**t) for t in result["themes"]],
        share_ready=result["share_ready"],
        original_length=len(request.raw_text),
        translated_length=len(result["summary"])
    )


@app.get("/disclaimer")
async def get_disclaimer():
    """Return the safety disclaimer for the application."""
    return {
        "title": "Important Notice",
        "content": """Say It Better is a communication aid designed to help you express your thoughts more clearly.

This tool does NOT:
• Provide therapy, counseling, or mental health treatment
• Diagnose any conditions
• Offer medical or psychological advice
• Replace professional care
• Handle crisis situations

If you are experiencing a mental health crisis or emergency, please contact:
• Emergency Services: 911
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741

Your text is processed only for the current request and is not stored or used for training purposes.""",
        "acknowledgment_required": True
    }


async def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings from Hugging Face API for theme similarity detection."""
    try:
        headers = {"Content-Type": "application/json"}
        if HF_TOKEN:
            headers["Authorization"] = f"Bearer {HF_TOKEN}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                HF_ENDPOINT,
                headers=headers,
                json={"inputs": texts}
            )
            
            if response.status_code == 503:
                # Model is loading, wait and retry
                raise HTTPException(status_code=503, detail="Model is loading, please try again in a few seconds")
            
            if response.status_code != 200:
                print(f"Embedding API Error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=502, detail="Embedding service unavailable")
            
            result = response.json()
            # HF returns embeddings directly as list of lists
            return result
            
    except Exception as e:
        print(f"Embedding Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)


@app.post("/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings for a list of texts using qwen-emb.
    Useful for comparing themes across multiple translation sessions.
    """
    embeddings = await get_embeddings(request.texts)
    return EmbeddingResponse(embeddings=embeddings)


@app.post("/analyze-themes", response_model=ThemeSimilarityResponse)
async def analyze_theme_similarity(request: ThemeSimilarityRequest):
    """
    Compare current themes with past themes to identify recurring patterns.
    Uses qwen-emb embeddings for semantic similarity.
    
    This does NOT diagnose or label - it only identifies similar language patterns.
    """
    if not request.current_themes or not request.past_themes:
        return ThemeSimilarityResponse(recurring_themes=[], similarity_scores={})
    
    # Get embeddings for all themes
    all_themes = request.current_themes + request.past_themes
    embeddings = await get_embeddings(all_themes)
    
    current_embeddings = embeddings[:len(request.current_themes)]
    past_embeddings = embeddings[len(request.current_themes):]
    
    # Find recurring themes (similarity > 0.7)
    recurring_themes = []
    similarity_scores = {}
    
    for i, current_theme in enumerate(request.current_themes):
        max_similarity = 0.0
        most_similar_past = None
        
        for j, past_theme in enumerate(request.past_themes):
            similarity = cosine_similarity(current_embeddings[i], past_embeddings[j])
            if similarity > max_similarity:
                max_similarity = similarity
                most_similar_past = past_theme
        
        similarity_scores[current_theme] = {
            "most_similar": most_similar_past,
            "score": round(max_similarity, 3)
        }
        
        if max_similarity > 0.7:
            recurring_themes.append(current_theme)
    
    return ThemeSimilarityResponse(
        recurring_themes=recurring_themes,
        similarity_scores=similarity_scores
    )


# --- Secure Sharing (In-Memory for Demo) ---
import uuid
import time

# Store shared links in memory: {share_id: SharedAndEncryptedData}
# In production, use Redis or a Database with TTL
shared_links = {}

@app.post("/share", response_model=ShareResponse)
async def create_share_link(request: ShareRequest):
    """
    Store an encrypted blob for temporary sharing.
    The server CANNOT read this data (it doesn't have the key).
    """
    share_id = str(uuid.uuid4())
    now = time.time()
    expires_at = now + (24 * 60 * 60) # 24 hours
    
    shared_links[share_id] = {
        "encrypted_data": request.encrypted_data,
        "iv": request.iv,
        "created_at": now,
        "expires_at": expires_at
    }
    
    # Cleanup expired links (lazy cleanup)
    expired_ids = [sid for sid, data in shared_links.items() if data["expires_at"] < now]
    for sid in expired_ids:
        del shared_links[sid]
        
    return ShareResponse(share_id=share_id, expires_at=str(expires_at))

@app.get("/share/{share_id}")
async def get_share_link(share_id: str):
    """Retrieve an encrypted blob by ID."""
    if share_id not in shared_links:
        raise HTTPException(status_code=404, detail="Link not found or expired")
    
    data = shared_links[share_id]
    
    # Check expiry
    if data["expires_at"] < time.time():
        del shared_links[share_id]
        raise HTTPException(status_code=410, detail="Link has expired")
        
    return data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
