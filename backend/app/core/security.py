"""Password hashing and expiring, HMAC-authenticated bearer tokens."""
import base64
import hashlib
import hmac
import json
import secrets
import time
from fastapi import HTTPException
from app.core.config import settings

ITERATIONS = 600_000

def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS).hex()
    return f"pbkdf2_sha256${ITERATIONS}${salt}${digest}"

def verify_password(password, encoded):
    try:
        algorithm, iterations, salt, expected = encoded.split("$")
        if algorithm != "pbkdf2_sha256" or int(iterations) != ITERATIONS:
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError, AttributeError):
        return False

def encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def create_token(user_id):
    payload = encode(json.dumps({"sub": user_id, "exp": int(time.time()) + settings.token_ttl_seconds,
                                 "nonce": secrets.token_hex(16)}, separators=(",", ":")).encode())
    signature = encode(hmac.digest(settings.auth_secret.encode(), payload.encode(), "sha256"))
    return f"{payload}.{signature}"

def token_subject(token):
    try:
        if len(token) > 2048:
            raise ValueError()
        payload, signature = token.split(".")
        expected = encode(hmac.digest(settings.auth_secret.encode(), payload.encode(), "sha256"))
        if not hmac.compare_digest(signature, expected):
            raise ValueError()
        data = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if data["exp"] <= time.time() or type(data["sub"]) is not int:
            raise ValueError()
        return data["sub"]
    except (ValueError, KeyError, TypeError, UnicodeError):
        raise HTTPException(401, "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
