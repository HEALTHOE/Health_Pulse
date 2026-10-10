"""Phase 6 tests: locations, indicators, trends, dashboards + scope isolation."""

from datetime import date

from app.models.health_record import HealthRecord


def _auth_header(client, email="admin@test.com", password="Password123!"):
    client.post("/api/auth/register", json={
        "email": email, "password": password, "full_name": "Admin",
        "role": "ADMIN"})
    token = client.post("/api/auth/login",
                        json={"email": email, "password": password}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _seed_minimal(db_session):
    """Two districts, one block+facility each, two months of records."""
    from app.models.location import Block, District, Facility
    from app.utils.seed import seed_indicators
    from app.analytics.indicator_engine import recompute_indicator_values

    seed_indicators(db_session)
    d1 = District(name="D1", code="D1")
    d2 = District(name="D2", code="D2")
    db_session.add_all([d1, d2])
    db_session.flush()
    b1 = Block(name="B1", code="B1", district_id=d1.id)
    b2 = Block(name="B2", code="B2", district_id=d2.id)
    db_session.add_all([b1, b2])
    db_session.flush()
    f1 = Facility(name="F1", facility_type="PHC", block_id=b1.id)
    f2 = Facility(name="F2", facility_type="PHC", block_id=b2.id)
    db_session.add_all([f1, f2])
    db_session.flush()
    for fac, imm in ((f1, 90), (f2, 50)):
        for month in (date(2026, 1, 1), date(2026, 2, 1)):
            db_session.add(HealthRecord(
                facility_id=fac.id, period=month,
                total_infants=100, fully_immunized_infants=imm,
                total_pregnant_women=100, anc_4_visits=imm,
                total_deliveries=100, institutional_deliveries=imm,
                total_tb_patients=10, tb_treatment_success=int(imm / 10),
                population=5000, malaria_cases=5,
                opd_visits=400, opd_expected=500,
                sanctioned_health_workers=10, positioned_health_workers=9,
                live_births=100, infant_deaths=2))
    db_session.commit()
    recompute_indicator_values(db_session)
    return d1, d2, b1, b2, f1, f2


def test_locations_and_pagination(client, db_session):
    headers = _auth_header(client)
    d1, d2, b1, b2, f1, f2 = _seed_minimal(db_session)

    districts = client.get("/api/districts", headers=headers)
    assert districts.status_code == 200
    assert len(districts.json()) == 2

    paged = client.get("/api/districts?limit=1", headers=headers)
    assert len(paged.json()) == 1

    detail = client.get(f"/api/districts/{d1.id}", headers=headers)
    assert detail.json()["name"] == "D1"
    assert client.get("/api/districts/9999", headers=headers).status_code == 404

    blocks = client.get(f"/api/blocks?district_id={d1.id}", headers=headers)
    assert len(blocks.json()) == 1
    assert blocks.json()[0]["district_name"] == "D1"

    facilities = client.get(f"/api/facilities?block_id={b1.id}", headers=headers)
    assert len(facilities.json()) == 1
    assert facilities.json()[0]["district_name"] == "D1"


def test_indicators_and_trend_shape(client, db_session):
    headers = _auth_header(client)
    d1, d2, b1, b2, f1, f2 = _seed_minimal(db_session)

    indicators = client.get("/api/indicators", headers=headers)
    assert indicators.status_code == 200
    assert len(indicators.json()) == 8
    first_id = indicators.json()[0]["id"]

    trend = client.get(
        f"/api/indicators/{first_id}/trend?level=DISTRICT&district_id={d1.id}&from=2026-01&to=2026-02",
        headers=headers)
    assert trend.status_code == 200
    body = trend.json()
    assert body["period"] == "monthly"
    assert [p["month"] for p in body["data"]] == ["2026-01", "2026-02"]
    assert client.get("/api/indicators/9999", headers=headers).status_code == 404


def test_dashboard_summary_district_block(client, db_session):
    headers = _auth_header(client)
    d1, d2, b1, b2, f1, f2 = _seed_minimal(db_session)

    summary = client.get(f"/api/dashboard/summary?district_id={d1.id}", headers=headers)
    assert summary.status_code == 200
    body = summary.json()
    assert body["district"]["name"] == "D1"
    assert body["period"] == "2026-02"
    assert set(body["indicators"]) == {"anc", "immunization", "tb_success",
                                       "institutional_delivery"}
    assert body["health_score"] > 0
    assert sum(body["performance"].values()) >= 4
    assert body["critical_alerts"] == 0  # no alerts until Phase 7

    ranking = client.get(f"/api/dashboard/district/{d1.id}", headers=headers)
    blocks = ranking.json()["blocks"]
    assert len(blocks) == 1
    assert blocks[0]["block"]["name"] == "B1"

    block_view = client.get(f"/api/dashboard/block/{b1.id}", headers=headers)
    assert block_view.json()["block"]["name"] == "B1"
    assert len(block_view.json()["facilities"]) == 1


def test_scope_isolation(client, db_session):
    admin_headers = _auth_header(client)
    d1, d2, b1, b2, f1, f2 = _seed_minimal(db_session)

    # Create DHO for D1 and block officer for B2 via admin register
    for email, role, extra in [
        ("dho@test.com", "DISTRICT_HEALTH_OFFICER", {"district_id": d1.id}),
        ("blk@test.com", "BLOCK_OFFICER",
         {"district_id": d2.id, "block_id": b2.id}),
    ]:
        created = client.post("/api/auth/register", headers=admin_headers, json={
            "email": email, "password": "Password123!", "full_name": "X",
            "role": role, **extra})
        assert created.status_code == 201, created.text

    def login_as(email):
        token = client.post("/api/auth/login",
                            json={"email": email, "password": "Password123!"}).json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    dho = login_as("dho@test.com")
    # DHO sees own district, blocked from the other
    assert client.get(f"/api/districts/{d1.id}", headers=dho).status_code == 200
    assert client.get(f"/api/districts/{d2.id}", headers=dho).status_code == 403
    assert client.get(f"/api/dashboard/district/{d2.id}", headers=dho).status_code == 403

    blk = login_as("blk@test.com")
    blocks = client.get("/api/blocks", headers=blk).json()
    assert [b["name"] for b in blocks] == ["B2"]
    assert client.get(f"/api/blocks/{b1.id}", headers=blk).status_code == 403

    # No token at all -> 403
    assert client.get("/api/districts").status_code == 403
