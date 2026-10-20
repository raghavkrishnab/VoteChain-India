import cv2

MIN_IMAGE_SIDE = 160
MIN_FACE_FRACTION = 0.15
MIN_SHARPNESS = 10.0


def basic_liveness(image, face_bbox):
    """Image-quality gate for the live photo.

    Educational check only (resolution, face size, blur). It is not
    anti-spoofing and will not stop a printed photo or a screen replay.
    """
    h, w = image.shape[:2]
    x1, y1, x2, y2 = face_bbox
    face_fraction = max(0.0, min(x2 - x1, y2 - y1)) / min(h, w)
    sharpness = float(cv2.Laplacian(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())

    reasons = []
    if min(h, w) < MIN_IMAGE_SIDE:
        reasons.append(f"image smaller than {MIN_IMAGE_SIDE}px")
    if face_fraction < MIN_FACE_FRACTION:
        reasons.append("face too small; move closer to the camera")
    if sharpness < MIN_SHARPNESS:
        reasons.append("image too blurry")

    return {
        "passed": not reasons,
        "reasons": reasons,
        "imageWidth": w,
        "imageHeight": h,
        "faceFraction": round(face_fraction, 3),
        "sharpness": round(sharpness, 1),
        "note": "Prototype quality check; does not prevent spoofing.",
    }
