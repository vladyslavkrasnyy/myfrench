from PIL import Image, ImageDraw, ImageOps
import os

# Define the directory containing images
IMAGE_DIR = "/Users/vladyslav/proteantecs/git/myfrench/media/images/topics/orig/"
SAVE_DIR = "/Users/vladyslav/proteantecs/git/myfrench/media/images/topics/"

def resize_and_round_corners(image_path, size=(260, 260), radius=7):
    """Resize an image and apply rounded corners."""
    with Image.open(image_path) as img:
        img = img.resize(size, Image.LANCZOS)  # High-quality resize

        # Create rounded mask
        mask = Image.new("L", size, 0)
        draw = ImageDraw.Draw(mask)
        draw.rounded_rectangle((0, 0, size[0], size[1]), radius, fill=255)

        # Apply rounded mask
        img = ImageOps.fit(img, size, method=Image.LANCZOS)
        img.putalpha(mask)  # Ensure transparency

        # Save with transparency
        output_path = os.path.join(SAVE_DIR, os.path.basename(image_path))
        img.save(output_path, format="PNG")  # Save as PNG to preserve transparency
        print(f"Processed: {output_path}")

def process_images():
    """Resize all images in the specified directory and round their corners."""
    for filename in os.listdir(IMAGE_DIR):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif")):
            image_path = os.path.join(IMAGE_DIR, filename)
            resize_and_round_corners(image_path)

if __name__ == "__main__":
    process_images()
    print("All images processed successfully!")
