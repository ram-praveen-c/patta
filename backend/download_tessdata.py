import os
import urllib.request

tess_dir = os.path.join(os.path.dirname(__file__), "tessdata")
os.makedirs(tess_dir, exist_ok=True)

files = {
    "tam.traineddata": "https://github.com/tesseract-ocr/tessdata/raw/main/tam.traineddata",
    "eng.traineddata": "https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata"
}

for filename, url in files.items():
    filepath = os.path.join(tess_dir, filename)
    if not os.path.exists(filepath):
        print(f"Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, filepath)
            print(f"Successfully downloaded {filename}")
        except Exception as e:
            print(f"Failed to download {filename}: {e}")
    else:
        print(f"{filename} already exists, skipping.")
