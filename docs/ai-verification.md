# AI Verification

The UI collects a consented demo reference image and a current image. OpenCV checks that each contains exactly one face. InsightFace with ONNX Runtime generates embeddings and cosine similarity is compared with an educational threshold. A basic image-size/quality liveness demonstration runs on the current image. Images are processed in memory and are not persisted.

The result is explicitly demonstrative and cannot establish legal identity, citizenship, eligibility, or advanced anti-spoofing security.
