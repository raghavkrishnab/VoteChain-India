# AI Service

Uses the existing Python 3.12 virtual environment and the already installed FastAPI, OpenCV, InsightFace, ONNX Runtime, NumPy, Uvicorn and python-multipart packages.

Run:

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

`POST /verify` accepts a current image and a consented reference image. OpenCV detects exactly one face in each image; InsightFace/ONNX Runtime generates embeddings; cosine similarity is compared with an educational threshold; and a basic image-quality/liveness check is applied to the current image. Images are processed in memory and are not persisted.

This does not prove citizenship, legal identity, voter eligibility, or resistance to advanced spoofing.
