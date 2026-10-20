"""Manual OCR check: python ocr_check.py <path-to-demo-document>"""
import sys

from services.document_ocr import calculate_age, extract_date_of_birth, extract_document_text

path = sys.argv[1] if len(sys.argv) > 1 else input("Path of the demo voter document: ").strip()
text = extract_document_text(path)
dob = extract_date_of_birth(text)
age = calculate_age(dob) if dob else None

print("========== OCR TEXT ==========")
print(text)
print("========== RESULT ==========")
print(f"Date of birth: {dob}")
print(f"Age: {age}")
print(f"Age eligible (18+): {'YES' if age is not None and age >= 18 else 'NO'}")
