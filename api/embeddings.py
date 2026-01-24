from http.server import BaseHTTPRequestHandler
import json
import os
import httpx

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            input_text = data.get('input', '')
            
            if not input_text:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Input text is required"}).encode())
                return
            
            # Get credentials from environment
            endpoint = os.environ.get('QWEN_EMB_ENDPOINT')
            token = os.environ.get('QWEN_EMB_TOKEN')
            
            if not endpoint or not token:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Embeddings API not configured"}).encode())
                return
            
            # Call the Qwen embeddings API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
            
            payload = {
                "input": input_text,
                "model": "Qwen/Qwen3-Embedding-8B"
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(endpoint, headers=headers, json=payload)
                response.raise_for_status()
                result = response.json()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except httpx.HTTPStatusError as e:
            self.send_response(e.response.status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
