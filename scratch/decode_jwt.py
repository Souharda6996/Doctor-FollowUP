import base64
import json

def decode_jwt(token):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return "Invalid JWT"
        
        # Add padding if needed
        payload = parts[1]
        payload += '=' * (-len(payload) % 4)
        
        decoded = base64.b64decode(payload).decode('utf-8')
        return json.loads(decoded)
    except Exception as e:
        return str(e)

key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYWV3Y3RnZ2llenl2aWxvd3piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDUwMSwiZXhwIjoyMDkxNDE2NTAxfQ.vxMAjS1D77eK0QkLD3-eCICgmKHUyy3I-uKI6ObJTHU"
print(decode_jwt(key))
