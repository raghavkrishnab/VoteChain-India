import os
import tempfile

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile

from services.document_ocr import DOCUMENT_EXTENSIONS, calculate_age, extract_date_of_birth, extract_document_text
from services.face_verification import FaceCountError, cosine_similarity, single_face
from services.liveness import basic_liveness

FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.45"))
MIN_VOTING_AGE = 18

app = FastAPI(title="Voting AI Service", version="1.1.0")


@app.get("/")
def root():
    return {"service": "ai-verification", "status": "ok", "prototype": True}


@app.get("/health")
def health():
    return {"ok": True}


def _decode(upload: UploadFile, label: str):
    image = cv2.imdecode(np.frombuffer(upload.file.read(), np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail=f"Invalid {label} image")
    return image


def _face(image, label: str):
    try:
        return single_face(image)
    except FaceCountError as e:
        problem = "No face detected" if e.count == 0 else "Multiple faces detected"
        raise HTTPException(status_code=400, detail=f"{problem} in {label} image")


def _read_document_text(upload: UploadFile):
    extension = os.path.splitext(upload.filename or "")[1].lower()
    if extension not in DOCUMENT_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported voter document format")
    data = upload.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty voter document")

    # A unique temp file per request, so concurrent requests never share a path.
    fd, path = tempfile.mkstemp(suffix=extension)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        return extract_document_text(path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read voter document: {e}")
    finally:
        os.remove(path)


# Plain `def`: FastAPI runs it in a worker thread, so CPU-heavy inference does
# not block the event loop.
@app.post("/verify")
def verify(
    image: UploadFile = File(...),
    reference: UploadFile = File(...),
    document: UploadFile = File(...),
):
    live = _decode(image, "live")
    ref = _decode(reference, "reference")

    live_face = _face(live, "live")
    ref_face = _face(ref, "reference")

    liveness = basic_liveness(live, live_face.bbox)
    if not liveness["passed"]:
        raise HTTPException(status_code=400, detail="Live image check failed: " + "; ".join(liveness["reasons"]))

    similarity = cosine_similarity(live_face.normed_embedding, ref_face.normed_embedding)
    face_verified = similarity >= FACE_MATCH_THRESHOLD

    date_of_birth = extract_date_of_birth(_read_document_text(document))
    age = calculate_age(date_of_birth) if date_of_birth else None
    age_eligible = age is not None and age >= MIN_VOTING_AGE

    # The OCR text itself is deliberately not returned: it is personal data.
    return {
        "verified": face_verified,
        "status": "verified" if face_verified else "rejected",
        "similarity": round(similarity, 4),
        "threshold": FACE_MATCH_THRESHOLD,
        "liveness": liveness,
        "dateOfBirth": date_of_birth,
        "age": age,
        "ageEligible": age_eligible,
        "eligible": face_verified and age_eligible,
        "message": (
            "Educational demo verification only. It does not prove legal identity, "
            "citizenship, or real-world voter eligibility."
        ),
    }
