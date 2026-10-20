# AI Service

FastAPI service on port 8000. See [docs/ai-verification.md](../docs/ai-verification.md).

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

It needs [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) (set `TESSERACT_CMD` if it is not on PATH) and, for PDF documents, Poppler (set `POPPLER_PATH`).

- `pytest` runs the unit and API tests.
- `python ocr_check.py <document>` shows what OCR and date-of-birth extraction find in a document.

This does not prove citizenship, legal identity or voter eligibility, and it does not resist spoofing.
