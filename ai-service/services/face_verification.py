import threading

import numpy as np

_app = None
_lock = threading.Lock()


class FaceCountError(ValueError):
    def __init__(self, count):
        super().__init__(f"Expected exactly one face, found {count}")
        self.count = count


def get_app():
    # Loaded on first use: the model is large and FastAPI handles requests in a threadpool.
    global _app
    with _lock:
        if _app is None:
            from insightface.app import FaceAnalysis

            _app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            _app.prepare(ctx_id=0, det_size=(640, 640))
    return _app


def single_face(image):
    """Detect faces once and return the only face, or raise FaceCountError."""
    faces = get_app().get(image)
    if len(faces) != 1:
        raise FaceCountError(len(faces))
    return faces[0]


def cosine_similarity(a, b):
    a = np.asarray(a, dtype=np.float32)
    b = np.asarray(b, dtype=np.float32)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom else 0.0
