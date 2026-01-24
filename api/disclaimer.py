"""
Say It Better - Disclaimer Endpoint
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
        
        self.wfile.write(json.dumps(response).encode())
