from services.document_ocr import (
    extract_document_text,
    extract_date_of_birth,
)


document_path = input(
    "Enter the full path of your demo voter document: "
).strip()

try:
    text = extract_document_text(document_path)

    print("\n========== OCR TEXT ==========")
    print(text)

    dob = extract_date_of_birth(text)

    print("\n========== DOB ==========")
    print(dob)

except Exception as e:
    print("\nOCR ERROR:")
    print(e)