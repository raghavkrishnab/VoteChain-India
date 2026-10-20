import cv2

def detect_faces(image):
    if image is None or image.size == 0: return []
    gray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
    cascade=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
    return cascade.detectMultiScale(gray,scaleFactor=1.1,minNeighbors=5,minSize=(80,80))
