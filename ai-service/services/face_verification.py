import threading

import numpy as np

_app = None
_lock = threading.Lock()


class FaceCountError(ValueError):
    def __init__(self, count):
        super().__init__(f"Expected exactly one face, found {count}")
        self.count = count


def is_ready():
    return _app is not None


_loader = None


def _load():
    try:
        get_app()
    except Exception as e:  # keep the service up; the next request starts a new attempt
        print(f"Face model failed to load: {e}")


def start_warm_up():
    """Load the model in the background (the first run downloads ~300 MB). No-op if already loading."""
    global _loader
    with _lock:
        if _app is None and (_loader is None or not _loader.is_alive()):
            _loader = threading.Thread(target=_load, daemon=True)
            _loader.start()


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
