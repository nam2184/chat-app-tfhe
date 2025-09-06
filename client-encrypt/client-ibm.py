from sqlalchemy.orm import context
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
from ibmhe import HEService
from kms.openapi_client.api.kms_api import KmsApi
from kms.openapi_client.api_client import ApiClient, Configuration
from kms.openapi_client.models.post_body_secret import PostBodySecret
from kms.openapi_client.models.post_body_model import PostBodyModel
import util
from io import BytesIO
from PIL import Image
import numpy as np
from ibmhe import HEService
from models import GetMessages200Schema, Message, ErrorType, ErrorTypeSchema, EncryptedMessageSchema, DecryptedMessageSchema, EncryptMessageBodySchema, DecryptMessageBodySchema, QueryParamsSchema
from serialiser import Network
from preprocess import preprocess_image
from koda_validate import TypedDictValidator, ValidationResult
from multiprocessing import Process
import pyhelayers

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
    url = f"{network.local_server_endpoint}/context"
    config = Configuration(
        host=network.local_server_endpoint,
    )
    he_service = HEService()
    with ApiClient(config) as api_client:
        kms_api = KmsApi(api_client)
        response = kms_api.context_get_with_http_info()
        decoded_context = ''
        if response.status_code == 200:
            decoded_context = base64.b64decode(response.data.context)
            he_service.context.load_context_from_buffer(decoded_context)
            he_service.context.save_to_file("context.bin")
        else:
            print("Download failed:", response.status_code)
        
        if response.data.context != '':
            post_body_model = PostBodyModel(context=response.data.context)
            post_body_secret = PostBodySecret(context= response.data.context)

        model_response = kms_api.model_post_with_http_info(post_body_model)
        
        if model_response.status_code == 200:
            decoded_model = base64.b64decode(model_response.data.model)
            nn = pyhelayers.load_he_model(decoded_context, decoded_model)
            nn.save_to_file("model.bin")
        else:
            print("Download model failed:", model_response.status_code)

        secret_response = kms_api.secret_post_with_http_info(post_body_secret)
        if secret_response.status_code == 200:
            decoded_secret = base64.b64decode(secret_response.data.secret_key)
            he_service.context.load_secret_key(decoded_secret)
            he_service.context.save_secret_key_to_file("secret.bin")
        else:
            print("Download secret failed:", secret_response.status_code)

def generate_client_configs(network: Network): 
    url = f"{network.remote_server_endpoint}/context"
    config = Configuration(
        host=network.remote_server_endpoint,
    )
    he_service = HEService()
    with ApiClient(config) as api_client:
        kms_api = KmsApi(api_client)
        response = kms_api.context_get_with_http_info()
        decoded_context = ''
        if response.status_code == 200:
            decoded_context = base64.b64decode(response.data.context)
            he_service.context.load_context_from_buffer(decoded_context)
            he_service.context.save_to_file("context.bin")
        else:
            print("Download failed:", response.status_code)
        
        if response.data.context != '':
            post_body_model = PostBodyModel(context=response.data.context)
            post_body_secret = PostBodySecret(context= response.data.context)

        model_response = kms_api.model_post_with_http_info(post_body_model)
        
        if model_response.status_code == 200:
            decoded_model = base64.b64decode(model_response.data.model)
            nn = pyhelayers.load_he_model(decoded_context, decoded_model)
            nn.save_to_file("model.bin")
        else:
            print("Download model failed:", model_response.status_code)

        secret_response = kms_api.secret_post_with_http_info(post_body_secret)
        if secret_response.status_code == 200:
            decoded_secret = base64.b64decode(secret_response.data.secret_key)
            he_service.context.load_secret_key(decoded_secret)
            he_service.context.save_secret_key_to_file("secret.bin")
        else:
            print("Download secret failed:", secret_response.status_code)

        del response
        del model_response
        del secret_response
        del he_service

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

            he_service = HEService()
            he_service.set_context_from_file("context.bin")
            nn = he_service.load_encrypted_model_from_context_file("model.bin")
            
            model_io_encoder = pyhelayers.ModelIoEncoder(nn)
            
            print("Encrypting image")
            encrypted_input = pyhelayers.EncryptedData(he_service.context)
            model_io_encoder.encode_encrypt(encrypted_input, [preprocessed_image])
            del nn
            del model_io_encoder
            del he_service
            
            print("Finished encrypting")
            #util.visual_encrypted_data(encrypted_input.hex())

            serialized_data = encrypted_input.save_to_buffer()
            encoded_serialized_data = base64.b64encode(serialized_data).decode("utf-8")
            del encrypted_input

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

            he_service = HEService()
            he_service.set_context_from_file("context.bin")
            nn = he_service.load_encrypted_model_from_context_file("model.bin")
            
            model_io_encoder = pyhelayers.ModelIoEncoder(nn)
            
            print("Encrypting image")
            encrypted_input = pyhelayers.DecryptData(he_service.context)
            model_io_encoder.encode_encrypt(encrypted_input, [preprocessed_image])
            del nn
            del model_io_encoder
            del he_service
            
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

