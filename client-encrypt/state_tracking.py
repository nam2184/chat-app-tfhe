import time
import psutil
import os
import uuid
import base64

def fix_base64_padding(b64_string: str) -> str:
    if b64_string.startswith("data:image"):
        b64_string = b64_string.split(",", 1)[-1]
    missing_padding = len(b64_string) % 4
    if missing_padding:
        b64_string += '=' * (4 - missing_padding)
    return b64_string


class Statistics:
    """
    Stateless-ish single-request tracker for Flask endpoints.
    Tracks:
    - uid: unique ID per request
    - response_size: size of the outgoing response in bytes
    - image_to_classify_size: size of the input payload (image/content) in bytes
    - encryption_time: time it took to encrypt/process the payload
    - memory_usage: process memory usage at the time of logging
    """

    def __init__(self):
        self.reset()

    def reset(self):
        self.uid = str(uuid.uuid4())  # unique ID for this request       
        self.response_size = 0
        self.image_to_classify_size = 0
        self.encryption_time = 0.0
        self.memory_usage = 0.0
        self.start_time = 0.0
        self.plaintext = ''
        self.fhe_ciphertext = ''

    def start_request(self, message: dict):
        """
        Call at the start of the request.
        message: dictionary matching EncryptMessageBodySchema
        """
        self.start_time = time.time()

        # calculate input size (content + image bytes)
        payload_bytes = b""
        if message.get("image"):
            self.plaintext = message.get("image")
            payload_bytes += base64.b64decode(fix_base64_padding(message["image"]))
        if message.get("content"):
            payload_bytes += message["content"].encode()
        # capture memory usage at start
        self.memory_usage = psutil.Process(os.getpid()).memory_info().rss  # bytes

    def end_request(self, message: dict):
        """
        Call after processing/encryption is done.
        message: dictionary matching EncryptedMessageSchema
        """
        # calculate response size (relevant fields)
        response_bytes = b""
        for field in ["content", "image", "image_to_classify", "iv"]:
            if message.get(field):
                response_bytes += str(message[field]).encode()
        self.response_size = len(response_bytes)

        # total processing/encryption time
        self.encryption_time = time.time() - self.start_time

        # memory usage at end
        self.memory_usage = psutil.Process(os.getpid()).memory_info().rss

    def visual_ciphertext(self, ciphertext):
        self.fhe_ciphertext = ciphertext
        self.image_to_classify_size = len(ciphertext)

    def to_dict(self):
        return {
            "uid": self.uid,
            "response_size": self.response_size,
            "image_to_classify_size": self.image_to_classify_size,
            "encryption_time": self.encryption_time,
            "memory_usage": self.memory_usage,
            "ciphertext" : self.fhe_ciphertext,
            "plaintext" : self.plaintext 
        }

