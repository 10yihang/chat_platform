import jwt
from datetime import datetime, timedelta, timezone

JWT_SECRET_KEY = "2GaM3DbkU6ReLNKMzOg3DjgHMYhJArsSWWNRx3A4t/Q="  # 直接使用你提供的密钥进行测试

payload = {
    'user_id': 2,
    'exp': datetime.now(timezone.utc) + timedelta(hours=24),
    'iat': datetime.now(timezone.utc),
    'sub': "2"
}

try:
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')
    print(f"Generated Token: {token}")
    decoded_token = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    print(f"Decoded Token: {decoded_token}")
except Exception as e:
    print(f"Error: {e}")