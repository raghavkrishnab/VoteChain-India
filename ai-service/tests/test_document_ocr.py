from datetime import date

from services.document_ocr import calculate_age, extract_date_of_birth

TODAY = date(2026, 10, 20)


def test_labelled_dob_wins_over_other_dates():
    text = "Issue Date: 01/02/2020\nDOB: 15/08/2004\nExpiry 01/02/2030"
    assert extract_date_of_birth(text, TODAY) == "2004-08-15"


def test_earliest_past_date_used_without_label():
    text = "Issued 01-02-2021\n15.08.1999\nValid till 01-02-2031"
    assert extract_date_of_birth(text, TODAY) == "1999-08-15"


def test_text_month_and_iso_formats():
    assert extract_date_of_birth("Date of Birth 3 March 1990", TODAY) == "1990-03-03"
    assert extract_date_of_birth("born 2001-12-31", TODAY) == "2001-12-31"


def test_invalid_and_missing_dates():
    assert extract_date_of_birth("DOB: 31/02/2004", TODAY) is None
    assert extract_date_of_birth("no dates here", TODAY) is None
    assert extract_date_of_birth("", TODAY) is None


def test_label_on_line_above_date():
    text = "ID #: 8008135\nDATE OF BIRTH:\n15 DEC 1999\nEXPIRY DATE: 01/01/2030"
    assert extract_date_of_birth(text, TODAY) == "1999-12-15"


def test_month_first_format():
    assert extract_date_of_birth("Date of Birth : January 1, 1970", TODAY) == "1970-01-01"
    assert extract_date_of_birth("DOB AUG 15 2004", TODAY) == "2004-08-15"


def test_impossible_or_garbled_dates_are_rejected():
    assert extract_date_of_birth("DATE OF BIRTH:\n32 DEC 1999", TODAY) is None
    assert extract_date_of_birth("Date of Birth : January 1, 197@", TODAY) is None


def test_calculate_age_respects_birthday():
    assert calculate_age("2008-10-20", TODAY) == 18
    assert calculate_age("2008-10-21", TODAY) == 17
    assert calculate_age("garbage", TODAY) is None
