# utils/image_processor.py
import requests
import base64
import logging
import os
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract text using Together AI's vision models (offloads processing to cloud).

    Args:
        image_bytes: The raw bytes of the uploaded image file.

    Returns:
        A string containing the extracted mathematical problem, ideally in LaTeX format.
        Returns an error message if extraction fails.
    """
    if not TOGETHER_API_KEY:
        return "Error: Together AI API key not configured."
    
    try:
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        url = "https://api.together.xyz/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {TOGETHER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract the mathematical problem from this image. Provide it in standard mathematical notation or LaTeX format if complex."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 500,
            "temperature": 0.1
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        extracted_text = result['choices'][0]['message']['content'].strip()
        
        return extracted_text
        
    except Exception as e:
        logger.error(f"Error with Together AI: {e}")
        return f"Error extracting text: {str(e)}"