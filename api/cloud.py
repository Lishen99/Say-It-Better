"""
Say It Better - Cloud Storage API (Zero-Knowledge E2E Encrypted)

SECURITY ARCHITECTURE:
- This server ONLY stores encrypted blobs
- All encryption/decryption happens CLIENT-SIDE
- The server has NO access to encryption keys
- User IDs are derived client-side from the passphrase
- Even developers cannot decrypt user data

Storage Options (in order of preference):
1. Redis Cloud - if STORAGE_KV_REDIS_URL is set
2. In-memory (for development only)
"""

from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# In-memory storage for development (NOT for production)
# In production, use Redis Cloud
_memory_store = {}

# Redis client singleton
_redis_client = None

def get_redis_client():
    """Get or create Redis client connection"""
    global _redis_client
    
    # Get Redis connection details from environment variables
    redis_host = os.getenv('REDIS_HOST')
    redis_port = os.getenv('REDIS_PORT')
    redis_password = os.getenv('REDIS_PASSWORD')
    
    if not redis_host or not redis_password:
        print("Redis credentials not configured in environment variables")
        return None
    
    if _redis_client is None:
        try:
            import redis
            # Connect to Redis Cloud using environment variables
            _redis_client = redis.Redis(
                host=redis_host,
                port=int(redis_port or 6379),
                decode_responses=True,
                username=os.getenv('REDIS_USERNAME', 'default'),
                password=redis_password,
                socket_timeout=10,
                socket_connect_timeout=10,
            )
            # Test connection
            _redis_client.ping()
            print("Redis connection successful!")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            _redis_client = None
            return None
    
    return _redis_client

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    }

def send_json_response(handler, status_code, data):
    handler.send_response(status_code)
    handler.send_header('Content-Type', 'application/json')
    for key, value in get_cors_headers().items():
        handler.send_header(key, value)
    handler.end_headers()
    handler.wfile.write(json.dumps(data).encode())

def validate_encrypted_payload(data):
    """
    Validate that the payload contains encrypted data.
    We don't validate the contents (we can't, it's encrypted),
    just the structure.
    """
    required_fields = ['userId', 'encryptedData', 'checksum']
    for field in required_fields:
        if field not in data:
            return False, f'Missing required field: {field}'
    
    encrypted_data = data.get('encryptedData', {})
    encrypted_fields = ['encrypted', 'salt', 'iv', 'algorithm']
    for field in encrypted_fields:
        if field not in encrypted_data:
            return False, f'Missing encryption field: {field}'
    
    # Validate user ID format
    user_id = data.get('userId', '')
    if not user_id.startswith('user_') or len(user_id) < 20:
        return False, 'Invalid user ID format'
    
    return True, None


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(204)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
    
    def do_GET(self):
        """
        GET /api/cloud?userId=xxx - Download encrypted data for a user
        GET /api/cloud/health - Health check
        """
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        
        # Health check
        if 'health' in path:
            redis_client = get_redis_client()
            storage_type = 'redis' if redis_client else 'memory'
            send_json_response(self, 200, {
                'status': 'healthy',
                'storage': storage_type,
                'message': 'E2E Encrypted Cloud Storage is running'
            })
            return
        
        # Get user data
        user_id = params.get('userId', [None])[0]
        if not user_id:
            send_json_response(self, 400, {'error': 'Missing userId parameter'})
            return
        
        # Validate user ID format
        if not user_id.startswith('user_') or len(user_id) < 20:
            send_json_response(self, 400, {'error': 'Invalid user ID format'})
            return
        
        # Retrieve encrypted data
        try:
            data = self._get_user_data(user_id)
            if data is None:
                send_json_response(self, 404, {'error': 'No data found for this user'})
                return
            
            send_json_response(self, 200, data)
        except Exception as e:
            send_json_response(self, 500, {'error': f'Failed to retrieve data: {str(e)}'})
    
    def do_POST(self):
        """
        POST /api/cloud - Upload encrypted data
        
        Body: {
            userId: string,
            encryptedData: { encrypted, salt, iv, algorithm, ... },
            entryCount: number,
            lastModified: string,
            checksum: string,
            version: number
        }
        """
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                send_json_response(self, 400, {'error': 'Empty request body'})
                return
            
            if content_length > 10 * 1024 * 1024:  # 10MB limit
                send_json_response(self, 413, {'error': 'Payload too large (max 10MB)'})
                return
            
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Validate the encrypted payload structure
            is_valid, error_msg = validate_encrypted_payload(data)
            if not is_valid:
                send_json_response(self, 400, {'error': error_msg})
                return
            
            user_id = data['userId']
            
            # Validate encryptedData structure before storing
            encrypted_data = data['encryptedData']
            if not isinstance(encrypted_data, dict):
                send_json_response(self, 400, {'error': 'encryptedData must be an object'})
                return
            
            required_encrypted_fields = ['encrypted', 'salt', 'iv', 'algorithm']
            for field in required_encrypted_fields:
                if field not in encrypted_data:
                    send_json_response(self, 400, {'error': f'Missing required encryption field: {field}'})
                    return
            
            # Store the encrypted data
            stored_data = {
                'encryptedData': encrypted_data,
                'entryCount': data.get('entryCount', 0),
                'checksum': data['checksum'],
                'version': data.get('version', 1),
                'lastModified': data.get('lastModified', datetime.utcnow().isoformat()),
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            self._save_user_data(user_id, stored_data)
            
            send_json_response(self, 200, {
                'success': True,
                'timestamp': stored_data['updatedAt'],
                'message': 'Encrypted data stored successfully'
            })
            
        except json.JSONDecodeError:
            send_json_response(self, 400, {'error': 'Invalid JSON in request body'})
        except Exception as e:
            send_json_response(self, 500, {'error': f'Failed to store data: {str(e)}'})
    
    def do_DELETE(self):
        """
        DELETE /api/cloud?userId=xxx - Delete all encrypted data for a user
        """
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        
        user_id = params.get('userId', [None])[0]
        if not user_id:
            send_json_response(self, 400, {'error': 'Missing userId parameter'})
            return
        
        # Validate user ID format
        if not user_id.startswith('user_') or len(user_id) < 20:
            send_json_response(self, 400, {'error': 'Invalid user ID format'})
            return
        
        try:
            self._delete_user_data(user_id)
            send_json_response(self, 200, {
                'success': True,
                'message': 'All encrypted data deleted'
            })
        except Exception as e:
            send_json_response(self, 500, {'error': f'Failed to delete data: {str(e)}'})
    
    # Storage methods - using Redis Cloud
    
    def _get_user_data(self, user_id):
        """Retrieve encrypted data for a user"""
        redis_client = get_redis_client()
        if redis_client:
            try:
                data = redis_client.get(f"sayitbetter:{user_id}")
                if data:
                    # If decode_responses=True, data is already a string, parse it
                    # If decode_responses=False, data is bytes, decode then parse
                    if isinstance(data, bytes):
                        data = data.decode('utf-8')
                    parsed_data = json.loads(data)
                    # Ensure encryptedData structure is preserved
                    if 'encryptedData' in parsed_data and isinstance(parsed_data['encryptedData'], dict):
                        return parsed_data
                    else:
                        print(f"Warning: Invalid encryptedData structure for user {user_id}")
                        return None
                return None
            except json.JSONDecodeError as e:
                print(f"Redis JSON decode error: {e}")
                print(f"Raw data: {data[:200] if data else 'None'}")
                return None
            except Exception as e:
                print(f"Redis GET error: {e}")
                # Fall back to memory
                return _memory_store.get(user_id)
        
        # Fall back to in-memory storage
        return _memory_store.get(user_id)
    
    def _save_user_data(self, user_id, data):
        """Store encrypted data for a user"""
        redis_client = get_redis_client()
        if redis_client:
            try:
                # Ensure encryptedData structure is valid
                if 'encryptedData' not in data or not isinstance(data['encryptedData'], dict):
                    print(f"Error: Invalid encryptedData structure for user {user_id}")
                    raise ValueError("Invalid encryptedData structure")
                
                # Serialize to JSON string
                json_str = json.dumps(data, ensure_ascii=False)
                
                # Store with 90 day expiry (optional - remove if you want permanent storage)
                redis_client.setex(
                    f"sayitbetter:{user_id}",
                    90 * 24 * 60 * 60,  # 90 days in seconds
                    json_str
                )
                print(f"Successfully stored data for user {user_id}")
                return True
            except Exception as e:
                print(f"Redis SET error: {e}")
                import traceback
                traceback.print_exc()
                # Fall back to memory
                _memory_store[user_id] = data
                return True
        
        # Fall back to in-memory storage
        _memory_store[user_id] = data
        return True
    
    def _delete_user_data(self, user_id):
        """Delete encrypted data for a user"""
        redis_client = get_redis_client()
        if redis_client:
            try:
                redis_client.delete(f"sayitbetter:{user_id}")
                return True
            except Exception as e:
                print(f"Redis DELETE error: {e}")
                # Fall back to memory
                if user_id in _memory_store:
                    del _memory_store[user_id]
                return True
        
        # Fall back to in-memory storage
        if user_id in _memory_store:
            del _memory_store[user_id]
        return True
