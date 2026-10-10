"""Phase 8 tests: upload, quality, audit logs, admin user + threshold APIs."""

from app.services.etl import REQUIRED_COLUMNS


def _admin_headers(client, email="admin@test.com"):
    client.post("/api/auth/register", json={
        "email": email, "password": "Password123!", "full_name": "Admin",
        "role": "ADMIN"})
    token = client.post("/api/auth/login", json={
        "email": email, "password": "Password123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _make_location(db_session, district="North District", block="ND Block A",
                   facility="ND Block A PHC-2"):
    from app.models.location import Block, District, Facility

    d = District(name=district, code="T1")
    db_session.add(d)
    db_session.flush()
    b = Block(name=block, code="TB1", district_id=d.id)
    db_session.add(b)
    db_session.flush()
    f = Facility(name=facility, facility_type="PHC", block_id=b.id)
    db_session.add(f)
    db_session.commit()
    from app.utils.seed import seed_indicators
    seed_indicators(db_session)
    return d, b, f


def _row(district="North District", block="ND Block A",
         facility="ND Block A PHC-2", period="2026-01", **overrides):
    base = {col: "1" for col in REQUIRED_COLUMNS}
    base.update({
        "district": district, "block": block, "facility": facility,
        "facility_type": "PHC", "period": period,
        "total_pregnant_women": "50", "anc_4_visits": "45",
        "total_deliveries": "40", "institutional_deliveries": "38",
        "total_infants": "50", "fully_immunized_infants": "46",
        "total_tb_patients": "10", "tb_treatment_success": "9",
        "population": "5000", "malaria_cases": "3",
        "opd_visits": "500", "opd_expected": "600",
        "sanctioned_health_workers": "10", "positioned_health_workers": "9",
        "live_births": "40", "infant_deaths": "1",
    })
    base.update(overrides)
    return base


def _csv_content(rows: list[dict]) -> bytes:
    import io
    import pandas as pd

    buffer = io.StringIO()
    pd.DataFrame(rows, columns=REQUIRED_COLUMNS).to_csv(buffer, index=False)
    return buffer.getvalue().encode()


def test_upload_clean_creates_records_and_audit(client, db_session):
    headers = _admin_headers(client)
    _make_location(db_session)
    content = _csv_content([
        _row(period="2026-01"),
        _row(period="2026-02"),
    ])
    response = client.post("/api/data/upload", headers=headers,
                           files={"file": ("clean.csv", content, "text/csv")})
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["total_rows"] == 2
    assert body["valid_rows"] == 2
    assert body["status"] == "COMPLETED"
    assert body["inserted"] == 2
    assert body["indicator_values_recomputed"] > 0
    assert "created" in body["alerts"]

    from app.models.health_record import HealthRecord
    assert db_session.query(HealthRecord).count() == 2

    logs = client.get("/api/audit-logs", headers=headers).json()
    assert any(log["action"] == "DATA_UPLOAD" for log in logs)


def test_upload_dirty_returns_partial_with_errors(client, db_session):
    headers = _admin_headers(client)
    _make_location(db_session)
    content = _csv_content([
        _row(period="2026-01"),
        _row(period="2026-02", anc_4_visits=""),  # missing
        _row(period="2026-03", malaria_cases="-5"),  # negative
        _row(period="2026-03"),  # duplicate of previous key? no -> valid-ish
    ])
    response = client.post("/api/data/upload", headers=headers,
                           files={"file": ("dirty.csv", content, "text/csv")})
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "PARTIAL"
    assert body["invalid_rows"] >= 2
    messages = " ".join(e["message"] for e in body["errors"])
    assert "Missing" in messages
    assert "Negative" in messages


def test_upload_rejects_bad_type_and_non_admin(client, db_session):
    headers = _admin_headers(client)
    d, b, f = _make_location(db_session)

    bad = client.post("/api/data/upload", headers=headers,
                      files={"file": ("evil.pdf", b"%PDF", "application/pdf")})
    assert bad.status_code == 400

    client.post("/api/auth/register", headers=headers, json={
        "email": "officer@test.com", "password": "Password123!",
        "full_name": "O", "role": "BLOCK_OFFICER",
        "district_id": d.id, "block_id": b.id})
    token = client.post("/api/auth/login", json={
        "email": "officer@test.com", "password": "Password123!"}).json()["access_token"]
    officer = {"Authorization": f"Bearer {token}"}
    denied = client.post("/api/data/upload", headers=officer, files={
        "file": ("a.csv", _csv_content([_row()]), "text/csv")})
    assert denied.status_code == 403


def test_quality_shape_and_completeness(client, db_session):
    headers = _admin_headers(client)
    _make_location(db_session)
    client.post("/api/data/upload", headers=headers, files={
        "file": ("q.csv", _csv_content([_row(period="2026-01"),
                                        _row(period="2026-0x")]), "text/csv")})
    quality = client.get("/api/data/quality", headers=headers)
    assert quality.status_code == 200
    body = quality.json()
    assert body["total_records"] == 1
    assert body["uploaded_rows"] == 2
    assert body["completeness_pct"] == 50.0
    assert body["last_upload"]["filename"] == "q.csv"
    assert body["total_uploads"] == 1
    # Unauthenticated cannot see quality.
    assert client.get("/api/data/quality").status_code == 403


def test_admin_user_management(client, db_session):
    headers = _admin_headers(client)
    d, b, f = _make_location(db_session)
    created = client.post("/api/auth/register", headers=headers, json={
        "email": "officer@test.com", "password": "Password123!",
        "full_name": "O", "role": "BLOCK_OFFICER",
        "district_id": d.id, "block_id": b.id})
    user_id = created.json()["id"]

    users = client.get("/api/admin/users", headers=headers).json()
    assert len(users) == 2

    # Deactivate -> login fails.
    patched = client.patch(f"/api/admin/users/{user_id}", headers=headers,
                           json={"is_active": False})
    assert patched.json()["is_active"] is False
    denied = client.post("/api/auth/login", json={
        "email": "officer@test.com", "password": "Password123!"})
    assert denied.status_code == 401

    # Cannot deactivate yourself.
    me = client.get("/api/auth/me", headers=headers).json()
    self_harm = client.patch(f"/api/admin/users/{me['id']}", headers=headers,
                             json={"is_active": False})
    assert self_harm.status_code == 400

    logs = client.get("/api/audit-logs?action=USER_UPDATE", headers=headers).json()
    assert len(logs) >= 1


def test_threshold_update_audited(client, db_session):
    from app.utils.seed import seed_indicators
    seed_indicators(db_session)
    headers = _admin_headers(client)

    updated = client.patch("/api/admin/indicators/TB_SUCCESS", headers=headers,
                           json={"target": 85.0})
    assert updated.status_code == 200
    assert updated.json()["target"] == 85.0

    # critical above target is invalid for higher-is-better.
    bad = client.patch("/api/admin/indicators/TB_SUCCESS", headers=headers,
                       json={"critical_threshold": 95.0})
    assert bad.status_code == 400
    assert client.patch("/api/admin/indicators/NOPE", headers=headers,
                        json={"target": 80}).status_code == 404

    logs = client.get("/api/audit-logs?action=INDICATOR_UPDATE",
                      headers=headers).json()
    assert any("TB_SUCCESS" in log["resource"] for log in logs)


def test_audit_logs_admin_only(client):
    headers = _admin_headers(client)
    assert client.get("/api/audit-logs", headers=headers).status_code == 200
    assert client.get("/api/audit-logs").status_code == 403
