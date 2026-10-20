import os
import re
from datetime import date, datetime

import pytesseract
from PIL import Image
from pdf2image import convert_from_path


pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def extract_text_from_image(file_path):
    image = Image.open(file_path)
    return pytesseract.image_to_string(image, config="--psm 6")


def extract_text_from_pdf(file_path):
    pages = convert_from_path(file_path, dpi=200)

    text = ""

    for page in pages:
        text += pytesseract.image_to_string(
            page,
            config="--psm 6"
        )

    return text


def extract_document_text(file_path):
    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)

    if extension in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
        return extract_text_from_image(file_path)

    raise ValueError(
        f"Unsupported document format: {extension}"
    )


def extract_date_of_birth(text):
    text = text.upper()

    # Example: 15/08/2004 or 15-08-2004
    match = re.search(
        r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b",
        text
    )

    if match:
        day = int(match.group(1))
        month = int(match.group(2))
        year = int(match.group(3))

        try:
            dob = date(year, month, day)
            return dob.isoformat()
        except ValueError:
            return None

    # Example: 15 AUG 2004 or 15 AUGUST 2004
    match = re.search(
        r"\b(\d{1,2})\s+"
        r"(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)"
        r"[A-Z]*\s+(\d{4})\b",
        text
    )

    if match:
        day = int(match.group(1))
        month_text = match.group(2)
        year = int(match.group(3))

        months = {
            "JAN": 1,
            "FEB": 2,
            "MAR": 3,
            "APR": 4,
            "MAY": 5,
            "JUN": 6,
            "JUL": 7,
            "AUG": 8,
            "SEP": 9,
            "OCT": 10,
            "NOV": 11,
            "DEC": 12,
        }

        month = months[month_text]

        try:
            dob = date(year, month, day)
            return dob.isoformat()
        except ValueError:
            return None

    return None


def calculate_age(date_of_birth):
    try:
        dob = datetime.strptime(
            date_of_birth,
            "%Y-%m-%d"
        ).date()
    except (ValueError, TypeError):
        return None

    today = date.today()

    age = today.year - dob.year

    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1

    return age