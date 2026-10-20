from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    validate_password_strength,
    verify_password,
)


def test_hash_is_bcrypt_and_verifies():
    hashed = hash_password("Secreta123!")
    assert hashed.startswith("$2")
    assert verify_password("Secreta123!", hashed)
    assert not verify_password("otra", hashed)


def test_verify_rejects_overlong_password():
    assert not verify_password("a" * 100, hash_password("Secreta123!"))


def test_token_claims_and_two_hour_expiry():
    token = create_access_token(7, "admin")
    payload = decode_access_token(token)
    assert payload["sub"] == "7"
    assert payload["role"] == "admin"
    assert payload["exp"] - payload["iat"] == 7200


def test_expired_token_is_rejected():
    token = create_access_token(1, "customer", now=datetime.now(UTC) - timedelta(hours=3))
    assert decode_access_token(token) is None


def test_tampered_token_is_rejected():
    token = create_access_token(1, "customer")
    assert decode_access_token(token[:-2] + "xx") is None
    forged = jwt.encode(
        {"sub": "1", "role": "admin", "iat": 1, "exp": 9999999999}, "otro-secreto", "HS256"
    )
    assert decode_access_token(forged) is None


@pytest.mark.parametrize(
    "password",
    ["Ab1!", "sinmayuscula1!", "SINMINUSCULA1!", "SinDigito!!", "SinSimbolo123"],
)
def test_weak_passwords_rejected(password):
    with pytest.raises(ValueError):
        validate_password_strength(password)


def test_strong_password_accepted():
    assert validate_password_strength("Valida123!") == "Valida123!"


def test_secret_comes_from_settings():
    assert get_settings().JWT_SECRET
