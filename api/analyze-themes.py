"""
Say It Better - Theme Analysis Endpoint
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

QWEN_EMB_ENDPOINT = os.environ.get("QWEN_EMB_ENDPOINT")
QWEN_EMB_TOKEN = os.environ.get("QWEN_EMB_TOKEN")
QWEN_EMB_MODEL = os.environ.get("QWEN_EMB_MODEL", "Qwen/Qwen3-Embedding-8B")


def cosine_similarity(vec1, vec2):
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)


def get_embeddings(texts):
    request_data = json.dumps({
        "model": QWEN_EMB_MODEL,
        "input": texts
    }).encode('utf-8')
    
    req = urllib.request.Request(
        f"{QWEN_EMB_ENDPOINT}/v1/embeddings",
        data=request_data,
        headers={
            "Authorization": f"Bearer {QWEN_EMB_TOKEN}",
            "Content-Type": "application/json"
        }
    )
    
    with urllib.request.urlopen(req, timeout=30) as response:
        result = json.loads(response.read().decode('utf-8'))
    
    return [item["embedding"] for item in result["data"]]


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            if not QWEN_EMB_ENDPOINT or not QWEN_EMB_TOKEN:
                # Return empty result if embeddings not configured
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "recurring_themes": [],
                    "similarity_scores": {}
                }).encode())
                return

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            current_themes = body.get('current_themes', [])
            past_themes = body.get('past_themes', [])
            
            if not current_themes or not past_themes:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "recurring_themes": [],
                    "similarity_scores": {}
                }).encode())
                return

            # Get embeddings
            all_themes = current_themes + past_themes
            embeddings = get_embeddings(all_themes)
            
            current_embeddings = embeddings[:len(current_themes)]
            past_embeddings = embeddings[len(current_themes):]
            
            # Find recurring themes
            recurring_themes = []
            similarity_scores = {}
            
            for i, current_theme in enumerate(current_themes):
                max_similarity = 0.0
                most_similar_past = None
                
                for j, past_theme in enumerate(past_themes):
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
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "recurring_themes": recurring_themes,
                "similarity_scores": similarity_scores
            }).encode())
            
        except Exception as e:
            self.send_response(200)  # Return 200 with empty result on error
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "recurring_themes": [],
                "similarity_scores": {}
            }).encode())
