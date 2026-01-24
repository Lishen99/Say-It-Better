"""
Say It Better - Health Check Endpoint
"""

from http.server import BaseHTTPRequestHandler
import json


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "status": "healthy",
            "message": "Say It Better API is running. This tool helps translate emotional language - it does not provide therapy or medical advice."
        }
        
        self.wfile.write(json.dumps(response).encode())
