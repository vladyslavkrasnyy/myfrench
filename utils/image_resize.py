from PIL import Image
import os

# Define the directory containing images
IMAGE_DIR = "/Users/vladyslav/proteantecs/git/myfrench/media/images/topics/"

def resize_image(image_path, size=(120, 120)):
    """Resize an image to the specified size and overwrite it."""
    with Image.open(image_path) as img:
        img_resized = img.resize(size, Image.LANCZOS)  # High-quality resize
        img_resized.save(image_path)  # Overwrite the original file
        print(f"Resized: {image_path}")

def process_images():
    """Resize all images in the specified directory."""
    for filename in os.listdir(IMAGE_DIR):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif")):
            image_path = os.path.join(IMAGE_DIR, filename)
            resize_image(image_path)

if __name__ == "__main__":
    process_images()
    print("All images resized successfully!")

