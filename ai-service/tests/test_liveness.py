import json

import numpy as np
import pytest

cv2 = pytest.importorskip("cv2")
from services.liveness import basic_liveness  # noqa: E402


def _noisy_image(h=400, w=400):
    return np.random.default_rng(0).integers(0, 255, (h, w, 3), dtype=np.uint8)


def test_result_is_json_serialisable_with_numpy_bbox():
    result = basic_liveness(_noisy_image(), np.array([100, 100, 300, 300], dtype=np.float32))
    json.dumps(result)  # raises if any numpy type leaks through
    assert result["passed"] is True


def test_rejects_small_face_and_small_image():
    small_face = basic_liveness(_noisy_image(), np.array([0, 0, 20, 20], dtype=np.float32))
    assert not small_face["passed"] and any("too small" in r for r in small_face["reasons"])
    tiny = basic_liveness(_noisy_image(100, 100), np.array([0, 0, 90, 90], dtype=np.float32))
    assert not tiny["passed"]


def test_rejects_blurry_image():
    flat = np.full((400, 400, 3), 128, dtype=np.uint8)
    result = basic_liveness(flat, np.array([100, 100, 300, 300], dtype=np.float32))
    assert "image too blurry" in result["reasons"]
