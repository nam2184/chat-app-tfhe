from datetime import datetime
from db import DBService, MessageModel
from flask_smorest import Api, Blueprint
from flask_smorest.blueprint import MethodView
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from werkzeug.datastructures import FileStorage
from dotenv import load_dotenv
import torch
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
from models import GetMessages200Schema, Message, ErrorType, ErrorTypeSchema, EncryptedMessageSchema, DecryptedMessageSchema, EncryptMessageBodySchema, DecryptMessageBodySchema, QueryParamsSchema
from serialiser import Network
from preprocess import preprocess_image
from koda_validate import TypedDictValidator, ValidationResult
from concrete.ml.deployment import FHEModelClient
from multiprocessing import Process
import zipfile

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

# --- Client config downloaders ---
def generate_client_configs_local(network: Network, chat_id: int): 
    client_dir_path = network.client_dir.name
    client_zip_path = os.path.join(client_dir_path, f"client{chat_id}.zip")
    
    if os.path.exists(client_zip_path):
        print("Client already exists. Skipping download.")
        model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
        serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()
        return

    # --- Fetch FHE client configs (JSON with base64 zip) ---
    url = f"{network.local_server_endpoint}/client/{chat_id}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        encoded_key_zip = data.get("keys")
        encoded_client_zip = data.get("client_specs")
        if not encoded_key_zip:
            print("No 'keys' field in response.")
            return
        if not encoded_client_zip:
            print("No 'client_specs' field in response.")
            return
        
        # Decode base64 and save to client{chat_id}.zip
        decoded_bytes = base64.b64decode(encoded_key_zip)
        with open(client_zip_path, "wb") as f:
            f.write(decoded_bytes)
        print(f"Downloaded FHE client keys to {client_zip_path}.")
        decoded_bytes = base64.b64decode(encoded_client_zip)
        with open(client_zip_path, "wb") as f:
            f.write(decoded_bytes)
        print(f"Downloaded FHE client configs to {client_zip_path}.")
    else:
        print("Download failed:", response.status_code)
        return

    # --- Load client and post evaluation keys ---
    model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
    serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()
    
    url = f"{network.local_inference_endpoint}/key"
    body = {"chat_id": chat_id, "file": serialized_evaluation_keys}
    response = requests.post(url, json=body)
    if response.status_code == 200:
        print("Posted public evaluation key to server.")
    else:
        print("Upload failed:", response.status_code)

def generate_client_configs(network: Network, chat_id: int): 
    client_dir_path = network.client_dir.name
    client_zip_path = os.path.join(client_dir_path, f"client{chat_id}.zip")
    
    if os.path.exists(client_zip_path):
        print("Client already exists. Skipping download.")
        model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
        serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()
        return

    # --- Fetch FHE client configs (JSON with base64 zip) ---
    url = f"{network.remote_server_endpoint}/client/{chat_id}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        encoded_key_zip = data.get("keys")
        encoded_client_zip = data.get("client_specs")
        if not encoded_key_zip:
            print("No 'keys' field in response.")
            return
        if not encoded_client_zip:
            print("No 'client_specs' field in response.")
            return
        
        # Decode base64 and save to client{chat_id}.zip
        decoded_bytes = base64.b64decode(encoded_key_zip)
        with open(client_zip_path, "wb") as f:
            f.write(decoded_bytes)
        print(f"Downloaded FHE client keys to {client_zip_path}.")
        decoded_bytes = base64.b64decode(encoded_client_zip)
        with open(client_zip_path, "wb") as f:
            f.write(decoded_bytes)
        print(f"Downloaded FHE client configs to {client_zip_path}.")
    else:
        print("Download failed:", response.status_code)
        return

    # --- Load client and post evaluation keys ---
    model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
    serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()
    
    url = f"{network.backend}/evaluation-key"
    body = {"chat_id": chat_id, "file": serialized_evaluation_keys}
    response = requests.post(url, json=body)
    if response.status_code == 200:
        print("Posted public evaluation key to server.")
    else:
        print("Upload failed:", response.status_code)

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

    
# --- Encrypt endpoint ---
@blp.route("/client/<int:chat_id>")
class Client(MethodView):
    @blp.doc(description="Generate client configs for FHE.")
    @blp.response(200)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def get(self,  chat_id):
        #token = request.headers.get("Authorization")
        try:
            generate_client_configs_local(network, chat_id)
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
            generate_normal_keys_local(chat_id, network)
            #generate_normal_keys(chat_id, network)
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
            
            print("starting encryption")
            cipher_aes = AES.new(aes_key, AES.MODE_CBC)
            if message.get("image") != "":
                image_data = base64.b64decode(fix_base64_padding(message["image"]))
                ct_bytes_image = cipher_aes.encrypt(pad(image_data, AES.block_size))
                message["image"] = base64.b64encode(ct_bytes_image).decode("utf-8")
                print("encrypted image normally")
                image = Image.open(BytesIO(image_data))

                memory_before = util.get_memory_usage()

                print("Preprocessing image")
                preprocessed_image = preprocess_image(image)

                model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
                print("Encrypting image")
                encrypted_input = model_client.quantize_encrypt_serialize(preprocessed_image)

                print("Finished encrypting")
                util.visual_encrypted_data(encrypted_input.hex())

                #serialized_data = pickle.dumps(encrypted_input)
                encoded_serialized_data = base64.b64encode(encrypted_input).decode("utf-8")
                message["image_to_classify"] = encoded_serialized_data

                memory_after = util.get_memory_usage()
                memory = (memory_after - memory_before) / (1024 * 1024)
                print("sending to local inference server") 
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
    @blp.alt_response(status_code=400,schema=ErrorTypeSchema)
    def post(self, data):
        try:
            message = data
            class_result_encoded = message.get("classification_result")
            if class_result_encoded and class_result_encoded != "":
                serialized_class_result = base64.b64decode(class_result_encoded)
                memory_before = util.get_memory_usage()
                model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
                result = model_client.deserialize_decrypt_dequantize(serialized_class_result)
                message["classification_result"] = result
                memory_after = util.get_memory_usage()
                memory = (memory_after - memory_before) / (1024 * 1024)
                print(memory)    
            
            # --- Normal AES-CBC decryption (image and content) ---
            normal_keys_dir = os.path.join(network.client_dir.name, f"normal_keys{message.get('chat_id')}")
            aes_key_path = os.path.join(normal_keys_dir, "aes_key.bin")
            if not os.path.exists(aes_key_path):
                raise FileNotFoundError("AES key not found in normal_keys directory.")
            with open(aes_key_path, "rb") as f:
                aes_key = f.read()

            # Decrypt image
            ct_image_b64 = message.get("image")
            iv_b64 = message.get("iv")
            if ct_image_b64 and iv_b64:
                ct_image_bytes = base64.b64decode(ct_image_b64)
                iv = base64.b64decode(iv_b64)
                cipher = AES.new(aes_key, AES.MODE_CBC, iv)
                decrypted_image_bytes = unpad(cipher.decrypt(ct_image_bytes), AES.block_size)
                message["image"] = base64.b64encode(decrypted_image_bytes).decode("utf-8")

            # Decrypt content
            ct_content_b64 = message.get("content")
            if ct_content_b64 and iv_b64:
                ct_content_bytes = base64.b64decode(ct_content_b64)
                iv = base64.b64decode(iv_b64)
                cipher = AES.new(aes_key, AES.MODE_CBC, iv)
                decrypted_content_bytes = unpad(cipher.decrypt(ct_content_bytes), AES.block_size)
                message["content"] = decrypted_content_bytes.decode("utf-8")
            return message

        except Exception as e:
            error = {"section": "messages", "message": str(e)}
            return error, 400

# --- Message endpoint ---
@cross_origin(supports_credentials=True)
@blp.route("/message")
class MessageView(MethodView):
    @blp.arguments(EncryptMessageBodySchema)
    @blp.doc(description="Insert a message into the database.")
    @blp.response(200, DecryptedMessageSchema)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def post(self, data):
        try:
            if not data.get("content") and not data.get("image"):
                raise ValueError("Either 'content' or 'image' must be provided.")

            message = MessageModel(**data)

            db = DBService()
            inserted = db.insert_message(message)

            return inserted.dict()

        except Exception as e:
            error = {"section": "messages", "message": str(e)}
            return error, 400

# --- Messages with Query Params ---
@cross_origin(supports_credentials=True)
@blp.route("/messages/<int:chat_id>")
class MessagesByChatView(MethodView):
    @blp.doc(description="Get messages by chat ID with optional sorting and pagination.")
    @blp.arguments(QueryParamsSchema, location="query", as_kwargs=True)
    @blp.response(200, GetMessages200Schema)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def get(self, chat_id, **kwargs):
        from sqlmodel import select, desc, asc, Session
        try:
            print(chat_id)
            skip = kwargs.get("skip", 0)
            limit = kwargs.get("limit", 10)
            sort_by = kwargs.get("sort_by", "id")
            order_by = kwargs.get("order_by", "desc").lower()
            # Validate sort_by against model fields
            if not hasattr(MessageModel, sort_by):
                raise ValueError(f"Invalid sort_by field: {sort_by}")

            # Determine sorting direction
            sort_column = getattr(MessageModel, sort_by)
            if order_by == "desc":
                sort_column = desc(sort_column)
            else:
                sort_column = asc(sort_column)
            print("Sorting by", sort_column)

            db = DBService()
            print("performing get requests")
            with Session(db.engine) as session:
                try:
                    print("getting total")
                    total = session.exec(
                        select(MessageModel).where(MessageModel.chat_id == chat_id)
                    ).count()
                except Exception:
                    total = 0                # main query
                print("finish getting total")
                statement = (
                    select(MessageModel)
                    .where(MessageModel.chat_id == chat_id)
                    .order_by(sort_column)
                    .offset(skip)
                    .limit(limit)
                )
                print("Querying")

                try:
                    results = session.exec(statement).all()
                except Exception:
                    results = []                 

            # ✅ wrap result into schema
            return {
                "array": [msg.dict() for msg in results] if results else [],
                "meta": {
                    "total": total,
                }
            }

        except Exception as e:
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
    db = DBService()
    log_file_path = os.path.join(network.log_dir.name, "client.log")
    util.setup_logging(log_file_path, 'werkzeug')
    p1 = Process(target=run_flask_app, args=(app, 5002))
    p1.start()
    #model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
