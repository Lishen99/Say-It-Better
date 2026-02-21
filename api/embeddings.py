"""
Say It Better - Embeddings API using Hugging Face Inference API (free)
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

# Hugging Face Inference API endpoint
# Using BAAI/bge-small-en-v1.5 - fast and good quality
HF_MODEL = "BAAI/bge-small-en-v1.5"
HF_ENDPOINT = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

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
            
            # Support both 'input' (old format) and 'texts' (new format)
            input_text = data.get('input') or data.get('texts', '')
            
            if not input_text:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Input text is required"}).encode())
                return
            
            # Get Hugging Face token from environment (optional but recommended)
            hf_token = os.environ.get('HF_TOKEN')
            
            # Prepare request - HF expects {"inputs": "text"} or {"inputs": ["text1", "text2"]}
            if isinstance(input_text, list):
                payload = json.dumps({"inputs": input_text}).encode('utf-8')
            else:
                payload = json.dumps({"inputs": input_text}).encode('utf-8')
            
            headers = {"Content-Type": "application/json"}
            if hf_token:
                headers["Authorization"] = f"Bearer {hf_token}"
            
            req = urllib.request.Request(HF_ENDPOINT, data=payload, headers=headers)
            
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            # Format response to match expected structure
            # HF returns embeddings directly as array or array of arrays
            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], list):
                    # Multiple embeddings returned
                    formatted_result = {"embeddings": result}
                else:
                    # Single embedding returned
                    formatted_result = {"embeddings": [result]}
            else:
                formatted_result = {"embeddings": result}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(formatted_result).encode())
            
        except urllib.error.HTTPError as e:
            error_msg = f"Hugging Face API error: {e.code}"
            if e.code == 503:
                error_msg = "Model is loading, please try again in a few seconds"
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": error_msg}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
