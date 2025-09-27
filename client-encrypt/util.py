import base64
import numpy as np
import logging
from PIL import Image
import psutil
from io import BytesIO

def setup_logging(log_file_path, logger_name):
    """
    Set up logging to file and attach it to the specified logger.
    
    Args:
        log_file_path (str): Path to the log file where logs will be written.
        logger_name (str): The name of the logger to configure (e.g., 'werkzeug').
    
    Returns:
        Logger: Configured logger with file logging enabled.
    """
    logger = logging.getLogger(logger_name)
    logger.handlers = []
    
    logger.setLevel(logging.INFO)
    
    file_handler = logging.FileHandler(log_file_path)
    
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    
    return logger

def get_memory_usage():
    process = psutil.Process()
    return process.memory_info().rss  # Resident Set Size (memory used by process)


def visual_encrypted_data_base64(binary_data_str: str) -> str:
    """
    Convert binary ciphertext string (hex) into a padded RGB image and return as base64 string.
    """
    try:
        # Convert hex string to bytes
        binary_data = bytes.fromhex(binary_data_str.replace("\\x", "").replace("b'", "").replace("'", ""))

        # Calculate dimensions for an RGB image
        data_length = len(binary_data)
        width = int(data_length ** 0.5)
        height = (data_length // 3) // width

        required_length = width * height * 3
        if len(binary_data) < required_length:
            padded_data = binary_data + b'\x00' * (required_length - len(binary_data))
        else:
            padded_data = binary_data[:required_length]

        # Convert to numpy array and reshape
        image_array = np.frombuffer(padded_data, dtype=np.uint8).reshape((height, width, 3))

        # Create PIL Image
        image = Image.fromarray(image_array, "RGB")

        # Save to BytesIO buffer
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return img_base64

    except Exception as e:
        print("An error occurred while visualizing encrypted data:", e)
        return ""
