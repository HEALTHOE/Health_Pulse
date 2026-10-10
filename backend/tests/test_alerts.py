"""Phase 7 tests: alert creation, dedupe, persistence, resolve, PATCH, scope."""

from datetime import date

from app.models.health_record import HealthRecord


def _admin_headers(client, email="admin@test.com"):
    client.post("/api/auth/register", json={
        "email": email, "password": "Password123!", "full_name": "Admin",
        "role": "ADMIN"})
    token = client.post("/api/auth/login", json={
        "email": email, "password": "Password123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _seed_poor(db_session, months=(1, 2, 3), tb_success=5):
    """One district/block/facility with poor TB + immunization values."""
    from app.analytics.indicator_engine import recompute_indicator_values
    from app.models.location import Block, District, Facility
    from app.utils.seed import seed_indicators

    seed_indicators(db_session)
    district = District(name="D1", code="D1")
    db_session.add(district)
    db_session.flush()
    block = Block(name="B1", code="B1", district_id=district.id)
    db_session.add(block)
    db_session.flush()
    facility = Facility(name="F1", facility_type="PHC", block_id=block.id)
    db_session.add(facility)
    db_session.flush()
    for month in months:
        db_session.add(HealthRecord(
            facility_id=facility.id, period=date(2026, month, 1),
            total_infants=100, fully_immunized_infants=50,
            total_pregnant_women=100, anc_4_visits=50,
            total_deliveries=100, institutional_deliveries=50,
            total_tb_patients=10, tb_treatment_success=tb_success,
            population=5000, malaria_cases=2,
            opd_visits=400, opd_expected=500,
            sanctioned_health_workers=10, positioned_health_workers=9,
            live_births=100, infant_deaths=2))
    db_session.commit()
    recompute_indicator_values(db_session)
    return district, block, facility


def test_threshold_and_persistent_alerts(client, db_session):
    from app.services.alert_service import evaluate_alerts

    headers = _admin_headers(client)
    _seed_poor(db_session)
    result = evaluate_alerts(db_session)
    assert result["created"] > 0

    alerts = client.get("/api/alerts", headers=headers).json()
    assert len(alerts) > 0
    severities = {a["severity"] for a in alerts}
    assert "CRITICAL" in severities  # TB 50% < critical 70
    persistent = [a for a in alerts if "Persistent" in a["message"]]
    assert persistent, "expected a persistent-underperformance alert"

    critical_only = client.get("/api/alerts?severity=CRITICAL", headers=headers).json()
    assert all(a["severity"] == "CRITICAL" for a in critical_only)


def test_no_duplicate_active_alerts(client, db_session):
    from app.services.alert_service import evaluate_alerts

    _admin_headers(client)
    _seed_poor(db_session)
    first = evaluate_alerts(db_session)
    second = evaluate_alerts(db_session)
    assert first["created"] > 0
    assert second["created"] == 0


def test_auto_resolve_on_recovery(client, db_session):
    from app.analytics.indicator_engine import recompute_indicator_values
    from app.services.alert_service import evaluate_alerts

    headers = _admin_headers(client)
    district, block, facility = _seed_poor(db_session)
    evaluate_alerts(db_session)
    active_before = client.get("/api/alerts?status=ACTIVE", headers=headers).json()
    assert len(active_before) > 0

    # Recovery month: everything excellent.
    db_session.add(HealthRecord(
        facility_id=facility.id, period=date(2026, 4, 1),
        total_infants=100, fully_immunized_infants=98,
        total_pregnant_women=100, anc_4_visits=98,
        total_deliveries=100, institutional_deliveries=98,
        total_tb_patients=10, tb_treatment_success=10,
        population=5000, malaria_cases=0,
        opd_visits=600, opd_expected=500,
        sanctioned_health_workers=10, positioned_health_workers=10,
        live_births=100, infant_deaths=0))
    db_session.commit()
    recompute_indicator_values(db_session)
    result = evaluate_alerts(db_session)
    assert result["resolved"] > 0
    resolved = client.get("/api/alerts?status=RESOLVED", headers=headers).json()
    assert len(resolved) > 0


def test_patch_transitions_and_audit(client, db_session):
    from app.services.alert_service import evaluate_alerts

    headers = _admin_headers(client)
    _seed_poor(db_session)
    evaluate_alerts(db_session)
    alert_id = client.get("/api/alerts?status=ACTIVE", headers=headers).json()[0]["id"]

    ack = client.patch(f"/api/alerts/{alert_id}",
                       headers=headers, json={"status": "ACKNOWLEDGED"})
    assert ack.status_code == 200
    assert ack.json()["status"] == "ACKNOWLEDGED"

    resolved = client.patch(f"/api/alerts/{alert_id}",
                            headers=headers, json={"status": "RESOLVED"})
    assert resolved.status_code == 200

    # Cannot reopen a resolved alert.
    reopen = client.patch(f"/api/alerts/{alert_id}",
                          headers=headers, json={"status": "ACKNOWLEDGED"})
    assert reopen.status_code == 400
    # Invalid status value.
    bad = client.patch(f"/api/alerts/{alert_id}",
                       headers=headers, json={"status": "ACTIVE"})
    assert bad.status_code == 400
    assert client.patch("/api/alerts/99999",
                        headers=headers, json={"status": "RESOLVED"}).status_code == 404

    # Audit trail recorded both transitions.
    logs = client.get("/api/audit-logs", headers=headers).json()
    actions = {log["action"] for log in logs}
    assert "ALERT_ACKNOWLEDGED" in actions
    assert "ALERT_RESOLVED" in actions


def test_alert_scope_isolation(client, db_session):
    from app.models.location import Block, District
    from app.services.alert_service import evaluate_alerts

    admin_headers = _admin_headers(client)
    _seed_poor(db_session)  # D1
    d2 = District(name="D2", code="D2")
    db_session.add(d2)
    db_session.flush()
    b2 = Block(name="B2", code="B2", district_id=d2.id)
    db_session.add(b2)
    db_session.commit()
    evaluate_alerts(db_session)

    d1_id = client.get("/api/districts", headers=admin_headers).json()[0]["id"]
    client.post("/api/auth/register", headers=admin_headers, json={
        "email": "dho@test.com", "password": "Password123!", "full_name": "DHO",
        "role": "DISTRICT_HEALTH_OFFICER", "district_id": d2.id})
    token = client.post("/api/auth/login", json={
        "email": "dho@test.com", "password": "Password123!"}).json()["access_token"]
    dho = {"Authorization": f"Bearer {token}"}

    # DHO of D2 sees no D1 alerts and cannot filter by D1.
    mine = client.get("/api/alerts", headers=dho).json()
    assert all(a["district_id"] == d2.id or a["district_id"] is None for a in mine)
    assert client.get(f"/api/alerts?district_id={d1_id}", headers=dho).status_code == 403


def test_evaluate_endpoint_admin_only(client, db_session):
    _seed_poor(db_session)
    admin_headers = _admin_headers(client)
    response = client.post("/api/alerts/evaluate", headers=admin_headers)
    assert response.status_code == 200
    assert "created" in response.json()

    client.post("/api/auth/register", headers=admin_headers, json={
        "email": "officer@test.com", "password": "Password123!",
        "full_name": "O", "role": "BLOCK_OFFICER", "block_id": 1,
        "district_id": 1})
    token = client.post("/api/auth/login", json={
        "email": "officer@test.com", "password": "Password123!"}).json()["access_token"]
    officer = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/alerts/evaluate", headers=officer).status_code == 403
