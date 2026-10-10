"""Phase 5 tests: register, login, JWT, roles, scope validation."""

from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def _register(client, email, password="Password123!", **kwargs):
    payload = {"email": email, "password": password, "full_name": "Test",
               "role": "ADMIN", **kwargs}
    return client.post("/api/auth/register", json=payload)


def _login(client, email, password="Password123!"):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_bootstrap_register_and_login_and_me(client):
    response = _register(client, "admin@test.com")
    assert response.status_code == 201, response.text
    assert response.json()["role"] == "ADMIN"

    login = _login(client, "admin@test.com")
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    assert login.json()["token_type"] == "bearer"

    me = client.get("/api/auth/me",
                    headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "admin@test.com"


def test_duplicate_email_rejected(client):
    assert _register(client, "dup@test.com").status_code == 201
    token = _login(client, "dup@test.com").json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    dup = client.post("/api/auth/register", headers=headers, json={
        "email": "dup@test.com", "password": "Password123!",
        "full_name": "Dup", "role": "ADMIN"})
    assert dup.status_code == 400


def test_login_wrong_password_401(client):
    _register(client, "user@test.com")
    assert _login(client, "user@test.com", "WrongPass999!").status_code == 401
    assert _login(client, "nobody@test.com").status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 403  # no bearer
    bad = client.get("/api/auth/me",
                     headers={"Authorization": "Bearer garbage.token.here"})
    assert bad.status_code == 401


def test_expired_token_rejected(client):
    _register(client, "exp@test.com")
    payload = {"sub": "1", "role": "ADMIN",
               "iat": datetime.now(timezone.utc) - timedelta(hours=2),
               "exp": datetime.now(timezone.utc) - timedelta(hours=1)}
    token = jwt.encode(payload, settings.JWT_SECRET,
                       algorithm=settings.JWT_ALGORITHM)
    response = client.get("/api/auth/me",
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_non_admin_cannot_register_after_bootstrap(client, db_session):
    _register(client, "root@test.com")
    from app.models.location import Block, District

    district = District(name="D1", code="D1")
    db_session.add(district)
    db_session.flush()
    block = Block(name="B1", code="B1", district_id=district.id)
    db_session.add(block)
    db_session.commit()

    # No token at all -> 403 (bootstrap closed)
    response = _register(client, "x@test.com", role="BLOCK_OFFICER",
                         district_id=district.id, block_id=block.id)
    assert response.status_code == 403

    # Admin CAN create scoped users with a token
    token = _login(client, "root@test.com").json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post("/api/auth/register", headers=headers, json={
        "email": "officer@test.com", "password": "Password123!",
        "full_name": "Officer", "role": "BLOCK_OFFICER",
        "district_id": district.id, "block_id": block.id})
    assert created.status_code == 201, created.text
    assert created.json()["block_id"] == block.id


def test_scope_validation_400s(client):
    _register(client, "root2@test.com")
    token = _login(client, "root2@test.com").json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    # DHO without district
    bad = client.post("/api/auth/register", headers=headers, json={
        "email": "dho@test.com", "password": "Password123!",
        "role": "DISTRICT_HEALTH_OFFICER"})
    assert bad.status_code == 400
    # ADMIN with scope
    bad2 = client.post("/api/auth/register", headers=headers, json={
        "email": "a2@test.com", "password": "Password123!",
        "role": "ADMIN", "district_id": 1})
    assert bad2.status_code == 400
