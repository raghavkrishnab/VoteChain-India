from services.document_ocr import (
    extract_document_text,
    extract_date_of_birth,
    calculate_age,
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

    if dob:
        age = calculate_age(dob)

        print("\n========== AGE ==========")
        print(age)

        if age is not None and age >= 18:
            print("AGE ELIGIBLE: YES")
        else:
            print("AGE ELIGIBLE: NO")

    else:
        print("\nAGE CHECK: FAILED")
        print("Reason: Valid date of birth could not be extracted.")

except Exception as e:
    print("\nOCR ERROR:")
    print(e)