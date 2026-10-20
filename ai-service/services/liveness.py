import cv2

def basic_liveness(image):
    # Educational quality/size check only; it is not anti-spoofing.
    h,w=image.shape[:2]
    return {'passed': min(h,w)>=160, 'imageWidth':w, 'imageHeight':h, 'note':'Prototype liveness check; does not prevent advanced spoofing.'}
