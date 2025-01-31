import openai
import requests
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
OUTPUT_DIR = "/Users/vladyslav/proteantecs/git/myfrench/media/images/orig"

def generate_image(prompt, size="1024x1024", quality="standard", n=1):
    try:
        response = openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            quality=quality,
            n=n
        )
        return response.data[0].url
    except Exception as e:
        print(f"Error generating image: {e}")
        return None

def download_image(url, prompt):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            # Create images directory if it doesn't exist
            os.makedirs('generated_images', exist_ok=True)

            # Create filename from timestamp and prompt
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_prompt = "".join(x for x in prompt[:30] if x.isalnum() or x in (' ', '-', '_'))
            filename = f"{OUTPUT_DIR}/{timestamp}_{safe_prompt}.png"

            with open(filename, 'wb') as f:
                f.write(response.content)
            return filename
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None

def main():
    prompts = [
        "daily activities",
        "like wakeup, clean teeth, eat breakfast, go to work, come back home, eat dinner, watch tv, go to bed",
    ]

    for prompt in prompts:
        print(f"Generating image for: {prompt}")
        image_url = generate_image(prompt)
        if image_url:
            saved_path = download_image(image_url, prompt)
            print(f"Image saved to: {saved_path}\n")

if __name__ == "__main__":
    main()