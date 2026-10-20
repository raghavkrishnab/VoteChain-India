import pytest

pytest.importorskip("fastapi")
pytest.importorskip("cv2")
from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"ok": True}


def test_verify_rejects_invalid_image():
    files = {
        "image": ("live.jpg", b"not an image", "image/jpeg"),
        "reference": ("ref.jpg", b"not an image", "image/jpeg"),
        "document": ("doc.png", b"x", "image/png"),
    }
    res = client.post("/verify", files=files)
    assert res.status_code == 400
    assert res.json()["detail"] == "Invalid live image"
