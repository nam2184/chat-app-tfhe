from datetime import datetime
from concrete.fhe.compilation.artifacts import shutil
from flask_smorest import Api, Blueprint
from flask_smorest.blueprint import MethodView
from flask_smorest.response import Response
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from werkzeug.datastructures import FileStorage
from dotenv import load_dotenv
import torch
import torch.nn.functional as F
import base64
import os
import json
import pickle  # from stdlib, not pandas.core.generic
import requests
import binascii
import signal
import time
import util
from io import BytesIO
from PIL import Image
import numpy as np
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from models import ErrorType, ErrorTypeSchema, EncryptedMessageSchema, DecryptedMessageSchema, EncryptMessageBodySchema, DecryptMessageBodySchema, QueryParamsSchema
from serialiser import Network
from preprocess import preprocess_image
from koda_validate import TypedDictValidator, ValidationResult
from concrete.ml.deployment import FHEModelClient
from multiprocessing import Process
import zipfile
from state_tracking import Statistics
from threading import Lock

network = Network()

# --- Load environment variables ---
load_dotenv()

# --- Flask app config ---
app = Flask("client")
app.config["API_TITLE"] = "Client Encryption API"
app.config["API_VERSION"] = "1.0"
app.config["OPENAPI_VERSION"] = "3.0.0"
api = Api(app)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

blp = Blueprint("client", "client", url_prefix="/", description="Client Endpoints")

def encode_json_safe(obj):
    if isinstance(obj, dict):
        return {k: encode_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [encode_json_safe(v) for v in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj

# --- Utility: fix base64 padding ---
def fix_base64_padding(b64_string: str) -> str:
    if b64_string.startswith("data:image"):
        b64_string = b64_string.split(",", 1)[-1]
    missing_padding = len(b64_string) % 4
    if missing_padding:
        b64_string += '=' * (4 - missing_padding)
    return b64_string

def cleanup_extracted_folder(zip_path: str, target_dir: str):
    """Delete the top-level folder extracted from a zip file if it exists."""
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        top_level_dirs = {name.split("/")[0] for name in zip_ref.namelist() if "/" in name}
        if len(top_level_dirs) == 1:
            extracted_folder = os.path.join(target_dir, list(top_level_dirs)[0])
            if os.path.exists(extracted_folder):
                shutil.rmtree(extracted_folder)
                print(f"Deleted extracted folder {extracted_folder}.")

def get_extracted_folder_id(zip_path: str, target_dir: str):
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        top_level_dirs = {name.split("/")[0] for name in zip_ref.namelist() if "/" in name}
        if len(top_level_dirs) == 1:
            extracted_folder = os.path.join(target_dir, list(top_level_dirs)[0])
            if os.path.exists(extracted_folder):
                return extracted_folder 

def post_evaluation_keys(model_client: FHEModelClient, chat_id: int, url: str, access_token: str = None):
    """Serialize, encode and send evaluation keys to the given server endpoint."""
    serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()
    encoded_eval_keys = base64.b64encode(serialized_evaluation_keys).decode("utf-8")
    print("Got serialized_evaluation_keys")
    body = {"chat_id": chat_id, "file": encoded_eval_keys}

    headers = { "Origin" : network.local_encrypt_endpoint}
    if access_token:
        headers["Authorization"] = f"{access_token}"

    response = requests.post(url, json=body, headers=headers if headers else None)

    if response.status_code == 200:
        print("Posted public evaluation key to server.")
    else:
        print("Upload failed:", response.status_code, response.json())

# --- Client config downloaders ---
def generate_client_configs_local(network: Network, chat_id: int): 
    client_dir_path = network.client_dir.name
    client_keys_zip_path = os.path.join(client_dir_path, f"keys{chat_id}.bin")
    client_zip_path = os.path.join(client_dir_path, f"client.zip")
    
    if os.path.exists(client_zip_path) and os.path.exists(client_keys_zip_path):
        print("Client already exists. Skipping download.")
        #model_client = FHEModelClient(client_dir_path, key_dir=client_dir_path)
        model_client = FHEModelClient(client_dir_path)
        print("Loading keys")
        model_client.client.keys.load(client_keys_zip_path)
        print("Loaded keys")
        eval_key_url = f"{network.local_inference_endpoint}/key"
        
        post_evaluation_keys(model_client, chat_id, eval_key_url)
        cleanup_extracted_folder(client_keys_zip_path, client_dir_path)
        return

    # --- Fetch FHE client configs ---
    url = f"{network.local_server_endpoint}/client/{chat_id}"
    response = requests.get(url)
    if response.status_code != 200:
        print("Download failed:", response.json())
        return
    
    data = response.json()
    encoded_key_zip = data.get("keys")
    encoded_client_zip = data.get("client_specs")
    if not encoded_key_zip or not encoded_client_zip:
        print("Missing keys or client_specs in response.")
        return

    # Save + extract keysc
    with open(client_keys_zip_path, "wb") as f:
        f.write(base64.b64decode(encoded_key_zip))
    print("Extracted HE encryption keys.")

    # Save client config
    with open(client_zip_path, "wb") as f:
        f.write(base64.b64decode(encoded_client_zip))
    print(f"Downloaded FHE client configs to {client_zip_path}.")

    # --- Post eval keys ---
    model_client = FHEModelClient(client_dir_path)
    model_client.client.keys.load(client_keys_zip_path)
    
    eval_key_url = f"{network.local_inference_endpoint}/key"
    post_evaluation_keys(model_client, chat_id, eval_key_url)
    # Cleanup
    cleanup_extracted_folder(client_keys_zip_path, client_dir_path)

def generate_client_configs(network: Network, chat_id: int, access_token: str): 
    client_dir_path = network.client_dir.name
    client_keys_zip_path = os.path.join(client_dir_path, f"keys{chat_id}.bin")
    client_zip_path = os.path.join(client_dir_path, f"client.zip")
    
    if os.path.exists(client_zip_path) and os.path.exists(client_keys_zip_path):
        print("Client already exists. Skipping download.")
        model_client = FHEModelClient(client_dir_path)
        print("Created FHE client.")
        model_client.client.keys.load(client_keys_zip_path)
        eval_key_url = f"{network.backend}/evaluation-key"
        post_evaluation_keys(model_client, chat_id, eval_key_url, access_token)
        return

    # --- Fetch FHE client configs ---
    url = f"{network.remote_server_endpoint}/client/{chat_id}"
    response = requests.get(url)
    if response.status_code != 200:
        print("Download failed:", response.status_code)
        return

    data = response.json()
    encoded_key_zip = data.get("keys")
    encoded_client_zip = data.get("client_specs")
    if not encoded_key_zip or not encoded_client_zip:
        print("Missing keys or client_specs in response.")
        return

    # Save + extract keys
    with open(client_keys_zip_path, "wb") as f:
        f.write(base64.b64decode(encoded_key_zip))
    print("Extracted HE encryption keys.")

    # Save client config
    with open(client_zip_path, "wb") as f:
        f.write(base64.b64decode(encoded_client_zip))
    print(f"Downloaded FHE client configs to {client_zip_path}.")

    # --- Post eval keys ---
    model_client = FHEModelClient(client_dir_path)
    model_client.client.keys.load(client_keys_zip_path)
    
    eval_key_url = f"{network.backend}/evaluation-key"
    post_evaluation_keys(model_client, chat_id, eval_key_url, access_token)

def generate_normal_keys_local(chat_id, network: Network):
    # --- Paths ---
    client_dir_path = network.client_dir.name
    keys_zip_path = os.path.join(client_dir_path, f"normal_keys{chat_id}.zip")

    # --- Check if file already exists ---
    if os.path.exists(keys_zip_path):
        print(f"normal_keys{chat_id}.zip already exists at {keys_zip_path}")
        return

    # --- Fetch normal encryption keys ---
    normal_keys_url = f"{network.local_server_endpoint}/keys/{chat_id}"
    print(normal_keys_url)
    resp = requests.get(normal_keys_url, stream=True)
    print(resp.status_code)
    if resp.status_code == 200:
        with open(keys_zip_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Downloaded normal encryption keys.")

        # Extract keys
        with zipfile.ZipFile(keys_zip_path, "r") as zip_ref:
            zip_ref.extractall(client_dir_path)
        print("Extracted normal encryption keys.")
    else:
        print("Normal keys download failed:", resp.status_code)


    
def generate_normal_keys(chat_id, network: Network):
    # --- Paths ---
    client_dir_path = network.client_dir.name
    keys_zip_path = os.path.join(client_dir_path, f"normal_keys{chat_id}.zip")

    # --- Check if file already exists ---
    if os.path.exists(keys_zip_path):
        print(f"normal_keys{chat_id}.zip already exists at {keys_zip_path}")
        return

    # --- Fetch normal encryption keys ---
    normal_keys_url = f"{network.remote_server_endpoint}/keys/{chat_id}"
    print(normal_keys_url)
    resp = requests.get(normal_keys_url, stream=True)
    print(resp.status_code)
    if resp.status_code == 200:
        with open(keys_zip_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Downloaded normal encryption keys.")

        # Extract keys
        with zipfile.ZipFile(keys_zip_path, "r") as zip_ref:
            zip_ref.extractall(client_dir_path)
        print("Extracted normal encryption keys.")
    else:
        print("Normal keys download failed:", resp.status_code)

def send_inference_local(data, network: Network): 
    # --- Fetch FHE client configs ---
    post_encrypt_url = f"{network.local_inference_endpoint}/predict"
    
    try:
        print("OUTGOING JSON:", json.dumps(data, indent=2))
    except TypeError as e:
        print("JSON serialization failed:", e)
        for k, v in data.items():
            print(k, type(v))
    json_safe_data = encode_json_safe(data)
    response = requests.post(post_encrypt_url,json=json_safe_data)
    
    if response.status_code == 200:
        print(response.json()["classification_result"])
    elif response.status_code == 204:
        print("requires key but doesnt have it")
        model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
        serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()
        encoded_eval_keys = base64.b64encode(serialized_evaluation_keys).decode("utf-8")
        post_key_url = f"{network.local_inference_endpoint}/key"
        body = {"chat_id" : data["chat_id"], "file" : encoded_eval_keys}

        response = requests.post(post_key_url, json=body)
        if response.status_code == 200:
            print("Posted public evaluation key to server.")
        else:
            print("upload failed:", response.status_code)

        response = requests.post(post_encrypt_url,json=json_safe_data)
        if response.status_code == 200:
            print(response.json()["classification_result"])
        else:
            print("Download failed:", response.status_code)
    else :
        print("Download failed:", response.json())

stats_logger = Statistics()

@app.route("/logs/stream")
def stream_logs():
    def event_stream():
        while True:
            data = json.dumps(stats_logger.to_dict())
            yield f"data: {data}\n\n"  
            time.sleep(1)
    return Response(event_stream(), mimetype="text/event-stream")# --- Encrypt endpoint ---

@blp.route("/client/<int:chat_id>")
class Client(MethodView):
    @blp.doc(description="Generate client configs for FHE.")
    @blp.response(200)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def get(self,  chat_id):
        try:
            token = request.headers.get("Authorization")
            print(token)
            #generate_client_configs_local(network, chat_id)
            generate_client_configs(network, chat_id, token)
            return None, 200
        except Exception as e:
            return {"section": "messages", "message": str(e)}, 400

@cross_origin(supports_credentials=True)
@blp.route("/normal_keys/<int:chat_id>")
class NormalKeys(MethodView):
    @blp.doc(description="Encrypt image using FHE.")
    @blp.response(200)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def get(self, chat_id):
        try:    
            #generate_normal_keys_local(chat_id, network)
            generate_normal_keys(chat_id, network)
            return None, 200
        except Exception as e:
            error = {"section": "messages", "message": str(e)}
            return error, 400


# --- Encrypt endpoint ---
@cross_origin(supports_credentials=True)
@blp.route("/encrypt")
class Encrypt(MethodView):
    @blp.arguments(EncryptMessageBodySchema)
    @blp.doc(description="Encrypt image using FHE.")
    @blp.response(200, EncryptedMessageSchema)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def post(self, data):
        try:
            message = data
            stats_logger.reset()
            stats_logger.start_request(message)
            if not message.get("content") and not message.get("image"):
                raise ValueError("Either 'content' or 'image' must be provided.")
            normal_keys_dir = os.path.join(network.client_dir.name)

            # load AES key (example: saved as aes_key.bin)
            chat_id = message.get("chat_id")
            aes_key_path = os.path.join(normal_keys_dir, f"aes_key{chat_id}.bin")
            
            if not os.path.exists(aes_key_path):
                print("No aes key found")
                raise FileNotFoundError("AES key not found in normal_keys directory.")
            with open(aes_key_path, "rb") as f:
                aes_key = f.read()
            
            client_dir_path = network.client_dir.name
            client_keys_zip_path = os.path.join(
                client_dir_path, f"keys{message.get('chat_id')}.bin"
            )
            print(f"[DEBUG] Using client_dir_path={client_dir_path}")
            print(f"[DEBUG] Looking for keys zip at {client_keys_zip_path}")

            print("starting encryption")
            cipher_aes = AES.new(aes_key, AES.MODE_CBC)
            if message.get("image") != "":
                client_dir_path = network.client_dir.name

                image_data = base64.b64decode(fix_base64_padding(message["image"]))
                ct_bytes_image = cipher_aes.encrypt(pad(image_data, AES.block_size))
                message["image"] = base64.b64encode(ct_bytes_image).decode("utf-8")
                print("encrypted image normally")
                image = Image.open(BytesIO(image_data))

                print("Preprocessing image")
                preprocessed_image = preprocess_image(image)

                model_client = FHEModelClient(client_dir_path)
                model_client.client.keys.load(client_keys_zip_path)
                print("Encrypting image")
                encrypted_input = model_client.quantize_encrypt_serialize(preprocessed_image)

                print("Finished encrypting")

                #serialized_data = pickle.dumps(encrypted_input)
                encoded_serialized_data = base64.b64encode(encrypted_input).decode("utf-8")
                message["image_to_classify"] = encoded_serialized_data
                stats_logger.visual_ciphertext(util.visual_encrypted_data_base64(encrypted_input.hex()))

                message["iv"] = base64.b64encode(cipher_aes.iv).decode("utf-8")
                
                #send_inference_local(message, network)
            else:
                print("no image")

            if message.get("content") != "":
                message["iv"] = base64.b64encode(cipher_aes.iv).decode("utf-8")
                print("encrypting content :" + message["content"])
                ct_bytes_content = cipher_aes.encrypt(pad(message["content"].encode(), AES.block_size))
                print("encrypted content")
                message["content"] = base64.b64encode(ct_bytes_content).decode("utf-8")
                print("encoded content")

            stats_logger.end_request(message)
            return message

        except Exception as e:
            error = {"section": "messages", "message": str(e)}
            return error, 400

# --- Decrypt endpoint ---
@cross_origin(supports_credentials=True)
@blp.route("/decrypt")
class Decrypt(MethodView):
    @blp.arguments(DecryptMessageBodySchema)
    @blp.doc(description="Decrypt encrypted image using FHE.")
    @blp.response(200, DecryptedMessageSchema)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def post(self, data):
        try:
            #print("[DEBUG] Incoming data:", data)
            message = data

            # --- FHE Decryption ---
            class_result_encoded = message.get("classification_result")
            print("[DEBUG] classification_result (encoded) exists?", class_result_encoded)

            if class_result_encoded and class_result_encoded != "No image" and class_result_encoded != "Pending":
                client_dir_path = network.client_dir.name
                client_keys_zip_path = os.path.join(
                    client_dir_path, f"keys{message.get('chat_id')}.bin"
                )
                print(f"[DEBUG] Using client_dir_path={client_dir_path}")
                print(f"[DEBUG] Looking for keys zip at {client_keys_zip_path}")
                print("[DEBUG] Extracted HE encryption keys.")

                serialized_class_result = base64.b64decode(class_result_encoded)
                print("[DEBUG] Serialized class result length:", len(serialized_class_result))

                memory_before = util.get_memory_usage()
                print(f"[DEBUG] Memory before FHE decryption: {memory_before}")

                model_client = FHEModelClient(network.client_dir.name)
                model_client.client.keys.load(client_keys_zip_path)
                logits = model_client.deserialize_decrypt_dequantize(serialized_class_result)
                print("[DEBUG] Extracted classification result logits : ", logits)
                logits_tensor = torch.from_numpy(logits).float()               
                probs = F.softmax(logits_tensor, dim=1)
                print("[DEBUG] Probabilities:", probs)

                # Get the index of the max probability
                pred_idx = torch.argmax(probs, dim=1).item()

                # Map to class names
                classes = ["false", "true"]
                result = classes[pred_idx]                
                print("[DEBUG] Predicted class:", result)
                message["classification_result"] = result

                memory_after = util.get_memory_usage()
                memory = (memory_after - memory_before) / (1024 * 1024)
                print(f"[DEBUG] Memory after FHE decryption: {memory_after}")
                print(f"[DEBUG] Memory used (MB): {memory:.2f}")

            # --- Normal AES-CBC decryption ---
            #normal_keys_dir = os.path.join(network.client_dir.name, f"normal_keys{message.get('chat_id')}")
            aes_key_path = os.path.join(network.client_dir.name, f"aes_key{message.get('chat_id')}.bin")
            print(f"[DEBUG] AES key path: {aes_key_path}")

            if not os.path.exists(aes_key_path):
                raise FileNotFoundError("AES key not found in normal_keys directory.")
            with open(aes_key_path, "rb") as f:
                aes_key = f.read()
            print(f"[DEBUG] AES key length: {len(aes_key)}")

            # Decrypt image
            ct_image_b64 = message.get("image")
            iv_b64 = message.get("iv")
            print("[DEBUG] Image exists?", bool(ct_image_b64), " IV exists?", bool(iv_b64))

            if ct_image_b64 and iv_b64:
                ct_image_bytes = base64.b64decode(ct_image_b64)
                iv = base64.b64decode(iv_b64)
                cipher = AES.new(aes_key, AES.MODE_CBC, iv)
                decrypted_image_bytes = unpad(cipher.decrypt(ct_image_bytes), AES.block_size)
                message["image"] = base64.b64encode(decrypted_image_bytes).decode("utf-8")
                print(f"[DEBUG] Decrypted image length: {len(decrypted_image_bytes)}")

            # Decrypt content
            ct_content_b64 = message.get("content")
            print("[DEBUG] Content exists?", bool(ct_content_b64))

            if ct_content_b64 and iv_b64:
                ct_content_bytes = base64.b64decode(ct_content_b64)
                iv = base64.b64decode(iv_b64)
                cipher = AES.new(aes_key, AES.MODE_CBC, iv)
                decrypted_content_bytes = unpad(cipher.decrypt(ct_content_bytes), AES.block_size)
                message["content"] = decrypted_content_bytes.decode("utf-8")
                print("[DEBUG] Decrypted content:", message["content"])

            print("[DEBUG] Returning decrypted message successfully.")
            return message

        except Exception as e:
            print("[ERROR] Exception occurred:", str(e))
            error = {"section": "messages", "message": str(e)}
            return error, 400

# --- Register endpoints ---
api.register_blueprint(blp)

# --- Save OpenAPI spec ---
def save_openapi_spec(app, output_path="he-schema.json"):
    with app.app_context():
        spec_dict = api.spec.to_dict()
        with open(output_path, "w") as f:
            json.dump(spec_dict, f, indent=2)
        print(f"OpenAPI spec written to {output_path}")

# --- Run Flask App ---
def run_flask_app(app, port):
    app.run(host='127.0.0.1', port=port, debug=True)

# --- Main ---
if __name__ == '__main__':
    save_openapi_spec(app)
    log_file_path = os.path.join(network.log_dir.name, "client.log")
    util.setup_logging(log_file_path, 'werkzeug')
    p1 = Process(target=run_flask_app, args=(app, 5002))
    p1.start()
    #model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
