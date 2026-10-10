from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

from backend.config import SECRET_KEY

def create_access_token(data):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=30)

    to_encode.update({"exp" : expire})

    token = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

    return token

def verify_access_token(token):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        return payload
    except JWTError:
        print("JWT ERROR")
        return None
    