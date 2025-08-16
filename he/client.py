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
from kms.openapi_client.api.kms_api import KmsApi
from kms.openapi_client.api_client import ApiClient, Configuration
import util
from io import BytesIO
from PIL import Image
import numpy as np

from models import GetMessages200Schema, Message, ErrorType, ErrorTypeSchema, EncryptedMessageSchema, DecryptedMessageSchema, EncryptMessageBodySchema, DecryptMessageBodySchema, QueryParamsSchema
from serialiser import Network
from preprocess import preprocess_image
from koda_validate import TypedDictValidator, ValidationResult
from concrete.ml.deployment import FHEModelClient
from multiprocessing import Process
from openapi_client import get_model

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
# --- Utility: fix base64 padding ---
def fix_base64_padding(b64_string: str) -> str:
    if b64_string.startswith("data:image"):
        b64_string = b64_string.split(",", 1)[-1]
    missing_padding = len(b64_string) % 4
    if missing_padding:
        b64_string += '=' * (4 - missing_padding)
    return b64_string

# --- Client config downloaders ---
def generate_client_configs_local(network: Network): 
    client_dir_path = network.client_dir.name
    if any(os.scandir(client_dir_path)):
        print("Client directory already contains files. Skipping download.")
        model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
        serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()
        return

    url = f"{network.local_server_endpoint}/get_keys"
    
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(os.path.join(client_dir_path, "client.zip"), "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    else:
        print("Download failed:", response.status_code)
    model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
    serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()

def generate_client_configs(network: Network): 
    url = f"{network.remote_server_endpoint}/get_keys"
    config = Configuration(
        host=network.remote_server_endpoint,
    )
    with ApiClient(config) as api_client:
        kms_api = KmsApi(api_client)
        response = kms_api.client_get_with_http_info()
        if response.status_code == 200:
            with open(os.path.join(network.client_dir.name, "client.zip"), "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        else:
            print("Download failed:", response.status_code)
        model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
        serialized_evaluation_keys = model_client.get_serialized_evaluation_keys()

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

            print("Decoding image")
            image_data = base64.b64decode(fix_base64_padding(message["image"]))
            image = Image.open(BytesIO(image_data))

            memory_before = util.get_memory_usage()

            print("Preprocessing image")
            preprocessed_image = preprocess_image(image)

            model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
            print("Encrypting image")
            encrypted_input = model_client.quantize_encrypt_serialize(preprocessed_image)

            print("Finished encrypting")
            util.visual_encrypted_data(encrypted_input.hex())

            serialized_data = pickle.dumps(encrypted_input)
            encoded_serialized_data = base64.b64encode(serialized_data).decode("utf-8")
            message["image"] = encoded_serialized_data

            memory_after = util.get_memory_usage()
            memory = (memory_after - memory_before) / (1024 * 1024)

            return message

        except Exception as e:
            error = ErrorType(section="encrypting", message=str(e))
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

            serialized_image_data = base64.b64decode(message["image"])
            encrypted_image_data = pickle.loads(serialized_image_data)

            memory_before = util.get_memory_usage()

            model_client = FHEModelClient(network.client_dir.name, key_dir=network.client_dir.name)
            image = model_client.deserialize_decrypt_dequantize(encrypted_image_data)

            util.visual_encrypted_data(image.hex())

            encoded_image_data = base64.b64encode(image).decode("utf-8")
            message["image"] = encoded_image_data

            memory_after = util.get_memory_usage()
            memory = (memory_after - memory_before) / (1024 * 1024)

            return message

        except Exception as e:
            error = ErrorType(section="decrypting", message=str(e))
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
            error = ErrorType(section="message", message=str(e))
            return error, 400

# --- Messages with Query Params ---
@cross_origin(supports_credentials=True)
@blp.route("/messages/<int:chat_id>")
class MessagesByChatView(MethodView):
    @blp.doc(description="Get messages by chat ID with optional sorting and pagination.")
    @blp.arguments(QueryParamsSchema, location="query")
    @blp.response(200, GetMessages200Schema)
    @blp.alt_response(status_code=400, schema=ErrorTypeSchema)
    def get(self, chat_id):
        from sqlmodel import select, desc, asc
        try:
            skip = int(request.args.get("skip", 0))
            sort_by = request.args.get("sort_by", "id")
            order_by = request.args.get("order_by", "desc").lower()

            # Validate sort_by against model fields
            if not hasattr(MessageModel, sort_by):
                raise ValueError(f"Invalid sort_by field: {sort_by}")

            # Determine sorting direction
            sort_column = getattr(MessageModel, sort_by)
            if order_by == "desc":
                sort_column = desc(sort_column)
            else:
                sort_column = asc(sort_column)

            db = DBService()

            # Custom query using SQLModel session
            with db.session() as session:
                statement = select(MessageModel).where(
                    MessageModel.chat_id == chat_id
                ).order_by(sort_column).offset(skip)

                results = session.exec(statement).all()

            return [msg.dict() for msg in results]

        except Exception as e:
            error = ErrorType(section="messages", message=str(e))
            return error, 400

# --- Register endpoints ---
api.register_blueprint(blp)

# --- Save OpenAPI spec ---
def save_openapi_spec(app, output_path="openapi.json"):
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
    log_file_path = os.path.join(network.client_dir.name, "client.log")
    util.setup_logging(log_file_path, 'werkzeug')
    p1 = Process(target=run_flask_app, args=(app, 5001))
    p1.start()
    generate_client_configs_local(network)
    #generate_client_configs(network)

