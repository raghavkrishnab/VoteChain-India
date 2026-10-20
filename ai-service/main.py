import os

import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, HTTPException

from services.face_detection import detect_faces
from services.face_verification import (
    embedding_from_image,
    cosine_similarity,
)
from services.liveness import basic_liveness
from services.document_ocr import (
    extract_document_text,
    extract_date_of_birth,
    calculate_age,
)


app = FastAPI(
    title="Voting AI Service",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "service": "ai-verification",
        "status": "ok",
        "prototype": True,
    }


@app.get("/health")
def health():
    return {
        "ok": True
    }


@app.post("/verify")
async def verify(
    image: UploadFile = File(...),
    reference: UploadFile = File(...),
    document: UploadFile = File(...),
):
    # ---------------------------------------------------------
    # READ FACE IMAGES
    # ---------------------------------------------------------

    live_data = await image.read()
    ref_data = await reference.read()

    live = cv2.imdecode(
        np.frombuffer(live_data, np.uint8),
        cv2.IMREAD_COLOR,
    )

    ref = cv2.imdecode(
        np.frombuffer(ref_data, np.uint8),
        cv2.IMREAD_COLOR,
    )

    if live is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid live image",
        )

    if ref is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid reference image",
        )


    # ---------------------------------------------------------
    # FACE DETECTION
    # ---------------------------------------------------------

    live_faces = detect_faces(live)
    ref_faces = detect_faces(ref)

    if len(live_faces) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face detected in live image",
        )

    if len(live_faces) > 1:
        raise HTTPException(
            status_code=400,
            detail="Multiple faces detected in live image",
        )

    if len(ref_faces) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face detected in reference image",
        )

    if len(ref_faces) > 1:
        raise HTTPException(
            status_code=400,
            detail="Multiple faces detected in reference image",
        )


    # ---------------------------------------------------------
    # LIVENESS / IMAGE QUALITY
    # ---------------------------------------------------------

    liveness = basic_liveness(live)

    if not liveness["passed"]:
        raise HTTPException(
            status_code=400,
            detail="Image quality/face-size check failed",
        )


    # ---------------------------------------------------------
    # FACE VERIFICATION
    # ---------------------------------------------------------

    live_embedding = embedding_from_image(live)
    ref_embedding = embedding_from_image(ref)

    similarity = cosine_similarity(
        live_embedding,
        ref_embedding,
    )

    threshold = 0.45

    face_verified = similarity >= threshold


    # ---------------------------------------------------------
    # SAVE DOCUMENT TEMPORARILY
    # ---------------------------------------------------------

    document_data = await document.read()

    if not document_data:
        raise HTTPException(
            status_code=400,
            detail="Empty voter document",
        )

    original_name = document.filename or "document"

    extension = os.path.splitext(
        original_name
    )[1].lower()

    allowed_extensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".bmp",
        ".webp",
        ".pdf",
    ]

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported voter document format",
        )

    temporary_document = (
        f"_temporary_voter_document{extension}"
    )

    try:
        with open(
            temporary_document,
            "wb"
        ) as f:
            f.write(document_data)


        # -----------------------------------------------------
        # OCR
        # -----------------------------------------------------

        document_text = extract_document_text(
            temporary_document
        )

        date_of_birth = extract_date_of_birth(
            document_text
        )


        # -----------------------------------------------------
        # AGE CHECK
        # -----------------------------------------------------

        age = None
        age_eligible = False

        if date_of_birth:
            age = calculate_age(
                date_of_birth
            )

            if age is not None:
                age_eligible = age >= 18


        # -----------------------------------------------------
        # FINAL ELIGIBILITY
        # -----------------------------------------------------

        eligible = (
            face_verified
            and age_eligible
        )


        return {
            "verified": face_verified,
            "status": (
                "verified"
                if face_verified
                else "rejected"
            ),

            "similarity": round(
                float(similarity),
                4,
            ),

            "threshold": threshold,

            "liveness": liveness,

            "dateOfBirth": date_of_birth,

            "age": age,

            "ageEligible": age_eligible,

            "eligible": eligible,

            "documentText": document_text,

            "message": (
                "Educational demo verification only. "
                "It does not prove legal identity, "
                "citizenship, or real-world voter eligibility."
            ),
        }

    finally:
        # Always delete the temporary document.
        if os.path.exists(
            temporary_document
        ):
            os.remove(
                temporary_document
            )