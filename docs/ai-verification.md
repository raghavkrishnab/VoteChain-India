# AI Verification

`POST /verify` on the AI service receives the live photo, the reference face stored at registration, and the stored demo document. The backend supplies the last two, never the client.

1. InsightFace (`buffalo_l`, ONNX Runtime CPU) detects faces; each image must contain exactly one.
2. Quality gate on the live photo: resolution, face size and blur. **Not anti-spoofing.**
3. The cosine similarity of the face embeddings is compared with `FACE_MATCH_THRESHOLD` (default 0.45).
4. Tesseract OCR reads the document. The date of birth is the date on a line labelled DOB/Birth, otherwise the earliest past date. The voter must be 18+.

Documents are processed in a per-request temp file that is deleted afterwards, and the OCR text is not returned. The result is demonstrative and can't establish legal identity, citizenship or eligibility.
