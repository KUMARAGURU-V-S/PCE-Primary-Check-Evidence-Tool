import pytesseract
from PIL import Image
import sys
import os

def extract_text_from_image(image_path):
    """
    Extracts text from an image file using Tesseract OCR.
    """
    if not os.path.exists(image_path):
        print(f"Error: The file '{image_path}' was not found.")
        return None

    try:
        # Load the image
        img = Image.open(image_path)
        
        # Perform OCR
        # Note: Ensure 'tesseract-ocr' is installed on your system:
        # sudo apt install tesseract-ocr
        text = pytesseract.image_to_string(img)
        
        return text
    except Exception as e:
        print(f"An error occurred: {e}")
        if "tesseract is not installed" in str(e).lower():
            print("\nHELP: Tesseract OCR engine is missing.")
            print("Please run: sudo apt update && sudo apt install -y tesseract-ocr")
        return None

if __name__ == "__main__":
    # You can change 'log.jpg' to any image path you want to test
    target_image = 'log.jpg'
    
    print(f"--- Processing {target_image} ---")
    result = extract_text_from_image(target_image)
    
    if result:
        print("\nExtracted Text:")
        print("-" * 20)
        print(result)
        print("-" * 20)
    else:
        print("\nFailed to extract text.")
