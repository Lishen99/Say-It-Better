"""
Say It Better - Vercel Serverless API
Translation endpoint that securely uses environment variables for API keys
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

# API credentials from Vercel environment variables (set in Vercel dashboard)
GEMMA_ENDPOINT = os.environ.get("GEMMA_ENDPOINT")
GEMMA_TOKEN = os.environ.get("GEMMA_TOKEN")
GEMMA_MODEL = os.environ.get("GEMMA_MODEL", "google/gemma-3-27b-it")

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
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Handle translation request"""
        # CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            # Check for required env vars
            if not GEMMA_ENDPOINT or not GEMMA_TOKEN:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "API not configured. Set GEMMA_ENDPOINT and GEMMA_TOKEN in Vercel environment variables."
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
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "Please enter at least 10 characters"
                }).encode())
                return

            # Build prompt
            full_prompt = f"""{SYSTEM_PROMPT}

{get_tone_instruction(tone)}

Please rewrite the following text into clear, neutral language.

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

            # Call TELUS AI
            request_data = json.dumps({
                "model": GEMMA_MODEL,
                "prompt": full_prompt,
                "temperature": 0.7,
                "max_tokens": 1000
            }).encode('utf-8')
            
            req = urllib.request.Request(
                f"{GEMMA_ENDPOINT}/v1/completions",
                data=request_data,
                headers={
                    "Authorization": f"Bearer {GEMMA_TOKEN}",
                    "Content-Type": "application/json"
                }
            )
            
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            content = result["choices"][0]["text"]
            
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
            self.end_headers()
            self.wfile.write(json.dumps(parsed).encode())
            
        except urllib.error.HTTPError as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": f"AI service error: {e.code}"
            }).encode())
        except json.JSONDecodeError:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "Failed to parse AI response"
            }).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": str(e)
            }).encode())
