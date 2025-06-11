# utils/image_utils.py
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

def preprocess_image_for_gemini(image_bytes: bytes) -> Image.Image: # Renamed and changed return type
    """
    Preprocesses an image (resizing, converting format) for Google Gemini's vision API.
    Returns a PIL Image object.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB (Gemini prefers 3 channels, even for grayscale images)
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize to a reasonable maximum dimension if too large
        max_dim = 1024 # Example max dimension
        if max(img.size) > max_dim:
            # Use Image.LANCZOS for high-quality downsampling
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        return img # Return the PIL Image object
    except Exception as e:
        logger.error(f"Error during image preprocessing for Gemini: {e}")
        # Re-raise to be handled by the caller, or return a specific error indicator
        raise

# encode_image_to_base64 is no longer needed for Gemini integration, so it's removed.