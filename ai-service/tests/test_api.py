import pytest

pytest.importorskip("fastapi")
pytest.importorskip("cv2")
from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

client = TestClient(app)


def test_health_reports_model_state():
    body = client.get("/health").json()
    assert body["ok"] is True
    assert isinstance(body["modelReady"], bool)


def test_verify_requires_service_token_when_configured(monkeypatch):
    monkeypatch.setattr("main.SERVICE_TOKEN", "s3cret")
    files = {k: ("x.jpg", b"x", "image/jpeg") for k in ("image", "reference", "document")}
    assert client.post("/verify", files=files).status_code == 401
    assert client.post("/verify", files=files, headers={"X-Service-Token": "wrong"}).status_code == 401


def test_verify_returns_503_while_model_loads(monkeypatch):
    monkeypatch.setattr("main.is_ready", lambda: False)
    monkeypatch.setattr("main.start_warm_up", lambda: None)
    files = {k: ("x.jpg", b"x", "image/jpeg") for k in ("image", "reference", "document")}
    res = client.post("/verify", files=files)
    assert res.status_code == 503
    assert "loading" in res.json()["detail"]


def test_verify_rejects_invalid_image(monkeypatch):
    monkeypatch.setattr("main.is_ready", lambda: True)
    files = {
        "image": ("live.jpg", b"not an image", "image/jpeg"),
        "reference": ("ref.jpg", b"not an image", "image/jpeg"),
        "document": ("doc.png", b"x", "image/png"),
    }
    res = client.post("/verify", files=files)
    assert res.status_code == 400
    assert res.json()["detail"] == "Invalid live image"
