import numpy as np
from insightface.app import FaceAnalysis

_app=None
def get_app():
    global _app
    if _app is None:
        _app=FaceAnalysis(name='buffalo_l',providers=['CPUExecutionProvider'])
        _app.prepare(ctx_id=0,det_size=(640,640))
    return _app

def embedding_from_image(image):
    faces=get_app().get(image)
    if len(faces)!=1: raise ValueError('Exactly one face is required')
    return faces[0].normed_embedding.astype(np.float32)

def cosine_similarity(a,b):
    a=np.asarray(a); b=np.asarray(b)
    denom=np.linalg.norm(a)*np.linalg.norm(b)
    return float(np.dot(a,b)/denom) if denom else 0.0
