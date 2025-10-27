from PIL import Image
import numpy as np
import io

def preprocess_images_color(image_paths, size=(8, 8)):
    processed = []
    for path in image_paths:
        img = Image.open(path)                           # keep original color
        img_resized = img.resize(size, Image.LANCZOS)
        arr = np.array(img_resized, dtype=np.float32)    # shape (H, W, C)
        arr = arr / 255.0                                # normalize to [0,1]
        processed.append(arr)
    return np.array(processed) 

def process_images_color(image_paths):
    processed = []
    for path in image_paths:
        with Image.open(path) as img:
            buffer = io.BytesIO()
            img.save(buffer, format=img.format or "PNG")  # preserve original format if possible
            processed.append(buffer.getvalue())           # get raw bytes
    return processed


def preprocess_image(image: Image.Image, size: int = 48) -> np.ndarray:
    """
    Returns normalized RGB image array: shape=(3, H, W)
    """
    image = image.convert("RGB")  # ensure 3 channels
    image = image.resize((size, size), Image.LANCZOS)
    arr = np.array(image, dtype=np.float32) / 255.0
    # Convert to channel-first: (H, W, C) → (C, H, W)
    arr = np.transpose(arr, (2, 0, 1))
    arr = np.expand_dims(arr, axis=0)
    print(arr)
    return arr

