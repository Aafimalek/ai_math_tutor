import cv2
import pytesseract
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure pytesseract path if needed (Windows example)
pytesseract.pytesseract.tesseract_cmd = r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'

def preprocess_image(image_path):
    """Preprocess image for better OCR results (advanced)"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            logger.error(f"Failed to read image at {image_path}")
            return None

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Resize for better OCR (scale up)
        scale_percent = 220  # Try larger scaling
        width = int(gray.shape[1] * scale_percent / 100)
        height = int(gray.shape[0] * scale_percent / 100)
        gray = cv2.resize(gray, (width, height), interpolation=cv2.INTER_CUBIC)

        # Apply bilateral filter to preserve edges
        filtered = cv2.bilateralFilter(gray, 11, 17, 17)

        # Increase contrast using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrast = clahe.apply(filtered)

        # Try both adaptive and Otsu thresholding, return both for OCR
        adaptive = cv2.adaptiveThreshold(
            contrast, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        _, otsu = cv2.threshold(contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Denoise
        adaptive = cv2.fastNlMeansDenoising(adaptive, h=30)
        otsu = cv2.fastNlMeansDenoising(otsu, h=30)

        return [adaptive, otsu]
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        return None

def extract_text_from_image(image_path):
    """Extract text from image using Tesseract with math language data"""
    try:
        processed_imgs = preprocess_image(image_path)
        if processed_imgs is None:
            return "Error processing image"

        best_text = ""
        max_len = 0
        for img in processed_imgs:
            for psm in [6, 7, 11, 13]:
                custom_config = f'--oem 3 --psm {psm} -l equ+eng -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-=*/()[]{{}}^.,:;<>|\\'
                text = pytesseract.image_to_string(img, config=custom_config)
                text = text.strip()
                if len(text) > max_len:
                    best_text = text
                    max_len = len(text)
        logger.info(f"Extracted text: {best_text[:100]}...")
        return best_text if best_text else "Could not extract text. Try a clearer image."
    except Exception as e:
        logger.error(f"Error extracting text: {str(e)}")
        return f"Error extracting text: {str(e)}"