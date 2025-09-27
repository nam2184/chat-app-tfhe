import time
import requests
import os

headers = {
    'Content-Type': 'application/json; charset=utf-8'
}

LOCAL_ENCRYPT_ENDPOINT = "http://127.0.0.1:5002"
LOCAL_SERVER_ENDPOINT = "http://127.0.0.1:5000"
LOCAL_INFERENCE_ENDPOINT = "http://127.0.0.1:5001"
REMOTE_SERVER_ENDPOINT = "https://khanhmychattykms.win"
BACKEND_SERVER = "https://khanhmychattypi.win/api/v1"

# Define the cookies to be sent (like session or auth tokens)
cookies = {
    'session_id': 'your_session_id'  # Replace with actual session cookie
}
class Dir:
    def __init__(self, name):
        self.name = os.getcwd() + name
        if not os.path.exists(self.name):
            os.makedirs(self.name)

class Network:
    """Simulate a network on disk."""

    def __init__(self):
        # Create 3 temporary folder for server, client and dev with tempfile
        self.client_dir = Dir("/client") # pylint: disable=consider-using-with
        self.log_dir = Dir("/logs") # pylint: disable=consider-using-with
        self.local_server_endpoint = LOCAL_SERVER_ENDPOINT
        self.local_inference_endpoint = LOCAL_INFERENCE_ENDPOINT
        self.remote_server_endpoint = REMOTE_SERVER_ENDPOINT
        self.backend = BACKEND_SERVER
        self.local_encrypt_endpoint = LOCAL_ENCRYPT_ENDPOINT
