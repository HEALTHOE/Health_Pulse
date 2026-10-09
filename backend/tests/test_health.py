"""Phase 1 smoke test: health endpoint + DB connectivity."""


def test_health_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}
