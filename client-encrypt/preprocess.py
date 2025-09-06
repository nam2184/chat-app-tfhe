import numpy as np


def preprocess_image(image):
    image = image.resize((15, 15))  # Resize image to 8x8
     
    image = image.convert('L')  # 'L' mode converts to grayscale (8-bit pixel, black and white)
    
    image_array = np.array(image)
    
    image_array = image_array.astype(np.uint16)  # Convert to uint16 (since we can't use uint9 directly)
    image_array = np.bitwise_and(image_array, 0x1FF)  # Mask the values to 9 bits (simulate uint9)
    
    image_array = np.expand_dims(image_array.reshape((1, 15, 15)), axis=0)  # Now shape is (1, 1, 8, 8)
    
    return image_array
