FROM python:3.11-slim

# Tesseract reads ID documents, Poppler converts PDFs, libgl/glib are needed by OpenCV.
RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr poppler-utils libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# buffalo_s fits a 512 MB instance; set FACE_MODEL=buffalo_l on larger plans.
ARG FACE_MODEL=buffalo_s
ENV FACE_MODEL=${FACE_MODEL} PYTHONUNBUFFERED=1
# Download the face model at build time so the service is ready as soon as it starts.
RUN python -c "from services.face_verification import get_app; get_app()"

EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
