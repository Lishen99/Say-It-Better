"""
Say It Better - Vercel Serverless API
Translation endpoint using Groq API (free, fast inference)
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

# Groq API endpoint (OpenAI-compatible)
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"


def get_clean_env(name: str, default: str = "") -> str:
    value = os.environ.get(name, default)
    if value is None:
        return default
    return value.strip().strip('"').strip("'")

# System prompt
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
    if tone == "personal":
        return "\nUse first-person language and a warmer, more personal tone while remaining clear."
    elif tone == "clinical":
        return "\nUse precise, clinical language suitable for medical contexts."
    return "\nMaintain a balanced, neutral tone."


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        """Handle translation request"""
        try:
            # Get Groq API key from environment
            groq_api_key = get_clean_env("GROQ_API_KEY")
            groq_model = get_clean_env("GROQ_MODEL", "llama-3.3-70b-versatile")
            
            # Check for required env vars
            if not groq_api_key:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "API not configured. Set GROQ_API_KEY in Vercel environment variables.",
                    "setup": "Get your free API key at https://console.groq.com"
                }).encode())
                return

            # Parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            raw_text = body.get('raw_text', '')
            tone = body.get('tone', 'neutral')
            
            if len(raw_text) < 10:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "Please enter at least 10 characters"
                }).encode())
                return

            # Build user prompt
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

            # Call Groq API (OpenAI-compatible chat format)
            request_data = json.dumps({
                "model": groq_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            }).encode('utf-8')
            
            req = urllib.request.Request(
                GROQ_ENDPOINT,
                data=request_data,
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "SayItBetter/1.0 (+https://vercel.app)",
                    "Connection": "close"
                }
            )
            
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            # Groq uses chat format - content is in message
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            content = content.strip()
            if not content.startswith("{"):
                start = content.find("{")
                end = content.rfind("}") + 1
                if start != -1 and end > start:
                    content = content[start:end]
            
            parsed = json.loads(content)
            
            # Add metadata
            parsed["original_length"] = len(raw_text)
            parsed["translated_length"] = len(parsed.get("summary", ""))
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(parsed).encode())
            
        except urllib.error.HTTPError as e:
            error_body = ""
            try:
                error_body = e.read().decode('utf-8')[:500]
            except:
                pass
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            hint = None
            if e.code == 403 and "1010" in error_body:
                hint = "Groq request blocked (Cloudflare 1010). Re-save GROQ_API_KEY in Vercel without quotes/spaces, redeploy, and ensure server sends User-Agent header."
            self.wfile.write(json.dumps({
                "error": f"AI service error: {e.code}",
                "details": error_body,
                "hint": hint
            }).encode())
        except json.JSONDecodeError as je:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": f"Failed to parse AI response: {str(je)}"
            }).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": str(e),
                "type": type(e).__name__
            }).encode())

    def _send_cors_headers(self):
        """Send CORS headers verifying against ALLOWED_ORIGINS env var"""
        origin = self.headers.get('Origin', '')
        allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*')
        
        # If unrestricted (*) or origin matches
        if allowed_origins == '*' or origin in allowed_origins.split(','):
            self.send_header('Access-Control-Allow-Origin', origin if origin else '*')
        # Friendly fallback for Vercel previews (optional, creates security/convenience tradeoff)
        elif origin and ('.vercel.app' in origin or 'localhost' in origin):
             self.send_header('Access-Control-Allow-Origin', origin)
        
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
