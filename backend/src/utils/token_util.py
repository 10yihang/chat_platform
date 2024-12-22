import jwt
from config import Config

def decode_jwt_token(token):
    try:
        decoded = jwt.decode(
            token,
            Config.JWT_SECRET_KEY,
            algorithms=["HS256"]
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise Exception("Token已过期")
    except jwt.InvalidTokenError:
        raise Exception("无效的Token")