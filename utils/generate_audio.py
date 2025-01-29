import os
import json
import unicodedata
from gtts import gTTS

# Paths
VOCAB_DIR = "/Users/vladyslav/proteantecs/git/myfrench/vocabulary"
OUTPUT_DIR = "/Users/vladyslav/proteantecs/git/myfrench/media/audio/fr"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def sanitize_filename(text):
    """Normalize and sanitize filenames to remove accents, apostrophes, and replace spaces with underscores."""
    text = unicodedata.normalize("NFD", text)  # Decomposes characters (é → e + ́)
    text = text.encode("ascii", "ignore").decode("utf-8")  # Removes accents
    text = text.replace(" ", "_")  # Replace spaces with underscores
    text = text.replace("'", "_")  # Replace apostrophes with underscores
    return text

def process_vocabulary_files():
    """Process all JSON vocabulary files and generate audio for each French word."""
    for filename in os.listdir(VOCAB_DIR):
        if filename.endswith(".json"):  # Only process JSON files
            filepath = os.path.join(VOCAB_DIR, filename)

            with open(filepath, "r", encoding="utf-8") as file:
                data = json.load(file)

            for word_entry in data.get("words", []):
                french_word = word_entry.get("french")
                if not french_word:
                    continue  # Skip if there's no French word

                sanitized_name = sanitize_filename(french_word)
                audio_path = os.path.join(OUTPUT_DIR, f"{sanitized_name}.mp3")

                # Generate and save audio
                if not os.path.exists(audio_path):  # Avoid duplicate work
                    print(f"Generating audio for: {french_word} → {audio_path}")
                    tts = gTTS(french_word, lang="fr")
                    tts.save(audio_path)
                else:
                    print(f"Already exists: {audio_path}")

# Run the script
if __name__ == "__main__":
    process_vocabulary_files()
    print("✅ All audio files generated!")
