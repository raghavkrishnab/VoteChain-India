import os
import re
import shutil
from datetime import date

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DOCUMENT_EXTENSIONS = IMAGE_EXTENSIONS | {".pdf"}

_DEFAULT_WINDOWS_TESSERACT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

MONTHS = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}

# dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
_NUMERIC_DMY = re.compile(r"\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b")
# yyyy-mm-dd
_NUMERIC_YMD = re.compile(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b")
# 15 AUG 2004, 15 AUGUST 2004, 15-AUG-2004
_TEXT_MONTH = re.compile(r"\b(\d{1,2})[\s-]+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s-]+(\d{4})\b")
# January 1, 1970 / JAN 1 1970
_MONTH_FIRST = re.compile(r"\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b")
_DOB_LABEL = re.compile(r"\b(DOB|D\.O\.B|BIRTH|BORN)\b")


def _tesseract():
    # Imported lazily so the date parsing below can be used and tested without OCR installed.
    import pytesseract

    configured = os.getenv("TESSERACT_CMD")
    if configured:
        pytesseract.pytesseract.tesseract_cmd = configured
    elif not shutil.which("tesseract") and os.path.exists(_DEFAULT_WINDOWS_TESSERACT):
        pytesseract.pytesseract.tesseract_cmd = _DEFAULT_WINDOWS_TESSERACT
    return pytesseract


def extract_document_text(file_path):
    extension = os.path.splitext(file_path)[1].lower()
    if extension not in DOCUMENT_EXTENSIONS:
        raise ValueError(f"Unsupported document format: {extension}")

    tesseract = _tesseract()
    if extension == ".pdf":
        from pdf2image import convert_from_path

        pages = convert_from_path(file_path, dpi=200, poppler_path=os.getenv("POPPLER_PATH") or None)
        return "\n".join(tesseract.image_to_string(page, config="--psm 6") for page in pages)

    from PIL import Image

    with Image.open(file_path) as image:
        return tesseract.image_to_string(image, config="--psm 6")


def _dates_in(line):
    for d, m, y in _NUMERIC_DMY.findall(line):
        yield int(y), int(m), int(d)
    for y, m, d in _NUMERIC_YMD.findall(line):
        yield int(y), int(m), int(d)
    for d, mon, y in _TEXT_MONTH.findall(line):
        yield int(y), MONTHS[mon], int(d)
    for mon, d, y in _MONTH_FIRST.findall(line):
        yield int(y), MONTHS[mon], int(d)


def extract_date_of_birth(text, today=None):
    """Return the most likely date of birth in ISO format, or None.

    A date on (or directly below) a line labelled DOB/Birth wins. Otherwise
    the earliest valid past date is used, since issue and expiry dates on an
    ID are later.
    """
    today = today or date.today()
    labelled, others = [], []
    lines = [line for line in (text or "").upper().splitlines() if line.strip()]
    for i, line in enumerate(lines):
        # IDs often print the label on its own line with the date below it.
        label_above = i > 0 and _DOB_LABEL.search(lines[i - 1]) and not any(_dates_in(lines[i - 1]))
        bucket = labelled if _DOB_LABEL.search(line) or label_above else others
        for y, m, d in _dates_in(line):
            try:
                candidate = date(y, m, d)
            except ValueError:
                continue
            if candidate < today:
                bucket.append(candidate)

    chosen = labelled[0] if labelled else min(others, default=None)
    return chosen.isoformat() if chosen else None


def calculate_age(date_of_birth, today=None):
    try:
        dob = date.fromisoformat(date_of_birth)
    except (ValueError, TypeError):
        return None
    today = today or date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
