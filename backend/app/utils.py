import os
import base64
import pytesseract
from PIL import Image
import re
from typing import Tuple, Optional, Dict
import cloudinary
import cloudinary.uploader
from datetime import datetime
import requests
import json
from io import BytesIO

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
SITE_NAME = os.getenv("SITE_NAME", "Xpense App")

# Vision models in order of preference
VISION_MODELS = [
    "openai/gpt-4-vision-preview",  # Best but most expensive
    "anthropic/claude-3-haiku",     # Good balance of performance and cost
    "google/gemini-pro-vision",     # Good free alternative
]

def encode_image_to_base64(image_file: bytes) -> str:
    """Convert image bytes to base64 string"""
    return base64.b64encode(image_file).decode('utf-8')

def analyze_image_with_openrouter(image_file: bytes, model: str) -> Dict:
    """Analyze image using OpenRouter API with specified model"""
    base64_image = encode_image_to_base64(image_file)
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
    }
    
    data = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "This is a receipt or bill image. Please extract and return ONLY the following information in JSON format: 1. total_amount (as a float), 2. description (brief description of what the bill is for based on items or merchant name). Return ONLY the JSON, no other text."
                    },
                    {
                        "type": "image",
                        "image": f"data:image/jpeg;base64,{base64_image}"
                    }
                ]
            }
        ]
    }
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        
        # Extract the JSON from the response
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Parse the JSON content
        extracted_data = json.loads(content)
        return extracted_data
        
    except Exception as e:
        print(f"Error with {model}: {str(e)}")
        return None

def analyze_image_with_fallbacks(image_file: bytes) -> Tuple[Optional[float], Optional[str]]:
    """Try multiple models to analyze the image, falling back to simpler methods"""
    
    # Try each OpenRouter model in sequence
    for model in VISION_MODELS:
        try:
            result = analyze_image_with_openrouter(image_file, model)
            if result and "total_amount" in result:
                return result["total_amount"], result.get("description", "")
        except Exception as e:
            print(f"Error with {model}: {str(e)}")
            continue
    
    # Fallback to OCR if AI analysis fails
    try:
        image = Image.open(BytesIO(image_file))
        text = extract_text_from_image(image)
        amount = extract_amount_from_text(text)
        return amount, ""
    except Exception as e:
        print(f"Error with OCR fallback: {str(e)}")
        return None, None

def upload_image(image_file: bytes, folder: str = "bills") -> str:
    """Upload an image to Cloudinary and return the URL"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    result = cloudinary.uploader.upload(
        image_file,
        folder=folder,
        public_id=f"bill_{timestamp}",
        resource_type="image"
    )
    return result["secure_url"]

def extract_text_from_image(image: Image.Image) -> str:
    """Extract text from an image using OCR"""
    return pytesseract.image_to_string(image)

def extract_amount_from_text(text: str) -> Optional[float]:
    """Extract the total amount from OCR text"""
    # Common patterns for amounts in receipts
    patterns = [
        r'total[\s:]*[$]?\s*(\d+[.,]\d{2})',  # matches "total: $123.45" or "total 123.45"
        r'amount[\s:]*[$]?\s*(\d+[.,]\d{2})',  # matches "amount: $123.45"
        r'[$]\s*(\d+[.,]\d{2})',  # matches "$123.45"
        r'(\d+[.,]\d{2})\s*[$]',   # matches "123.45$"
        r'sum[\s:]*[$]?\s*(\d+[.,]\d{2})',  # matches "sum: $123.45"
        r'due[\s:]*[$]?\s*(\d+[.,]\d{2})'   # matches "due: $123.45"
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text.lower())
        amounts = [float(match.group(1).replace(',', '.')) for match in matches]
        if amounts:
            # Usually the largest amount is the total
            return max(amounts)
    
    return None

def process_bill_image(image_file: bytes) -> Tuple[str, Optional[float], Optional[str], Optional[str]]:
    """Process a bill image: upload it, analyze it, and return the results"""
    # Upload image to cloud storage
    image_url = upload_image(image_file)
    
    # Try AI analysis with fallbacks
    amount, description = analyze_image_with_fallbacks(image_file)
    
    # Fallback to OCR for text extraction
    if amount is None:
        try:
            image = Image.open(BytesIO(image_file))
            extracted_text = extract_text_from_image(image)
            amount = extract_amount_from_text(extracted_text)
        except Exception:
            extracted_text = ""
    else:
        # If AI analysis worked, still get the full OCR text for reference
        try:
            image = Image.open(BytesIO(image_file))
            extracted_text = extract_text_from_image(image)
        except Exception:
            extracted_text = ""
    
    return image_url, amount, description, extracted_text
