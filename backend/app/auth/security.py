"""Password hashing + verification (bcrypt via passlib).

WHY: passwords are never stored in plain text. Seed creates the admin
user through this helper, and login (Phase 5) verifies through it.
"""

from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)
