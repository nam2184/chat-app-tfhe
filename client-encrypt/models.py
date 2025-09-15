import base64
from typing import Optional, TypedDict
from datetime import datetime
import marshmallow as ma

class Message(TypedDict):
    chat_id: int
    sender_name: str
    receiver_id: int
    content: Optional[str]
    image: Optional[str]
    type: str
    is_typing: bool
    timestamp: datetime


class ErrorType(TypedDict):
    section: str
    message: str

class EncryptedMessageSchema(ma.Schema):
    chat_id = ma.fields.Int(required=True)
    sender_id = ma.fields.Int(required=True)
    sender_name = ma.fields.Str(required=True)
    receiver_id = ma.fields.Int(required=True)
    content = ma.fields.Str(required=True)
    iv = ma.fields.Str(required=False)
    image = ma.fields.Str(required=False)
    image_to_classify = ma.fields.Str(required=False)
    type = ma.fields.Str(required=True)
    is_typing = ma.fields.Bool(required=False)
    timestamp = ma.fields.DateTime(required=True)
    classification_result = ma.fields.Str(required=False)


class DecryptedMessageSchema(ma.Schema):
    chat_id = ma.fields.Int(required=True)
    sender_id = ma.fields.Int(required=True)
    sender_name = ma.fields.Str(required=True)
    receiver_id = ma.fields.Int(required=True)
    content = ma.fields.Str(required=True)
    image = ma.fields.Str(required=False)
    iv = ma.fields.Str(required=False)
    type = ma.fields.Str(required=True)
    is_typing = ma.fields.Bool(required=False)
    timestamp = ma.fields.DateTime(required=True)
    classification_result = ma.fields.Bool(required=True)

class EncryptMessageBodySchema(ma.Schema):
    chat_id = ma.fields.Int(required=True)
    sender_id = ma.fields.Int(required=True)
    sender_name = ma.fields.Str(required=True)
    receiver_id = ma.fields.Int(required=True)
    content = ma.fields.Str(required=True)
    image = ma.fields.Str(required=False)
    type = ma.fields.Str(required=True)
    is_typing = ma.fields.Bool(required=False)
    timestamp = ma.fields.DateTime(required=True)
    classification_result = ma.fields.Str(required=False)

class DecryptMessageBodySchema(ma.Schema):
    chat_id = ma.fields.Int(required=True)
    sender_id = ma.fields.Int(required=True)
    sender_name = ma.fields.Str(required=True)
    receiver_id = ma.fields.Int(required=True)
    content = ma.fields.Str(required=True)
    image = ma.fields.Str(required=False)
    image_to_classify = ma.fields.Str(required=False)
    iv = ma.fields.Str(required=False)
    type = ma.fields.Str(required=True)
    is_typing = ma.fields.Bool(required=False)
    timestamp = ma.fields.DateTime(required=True)
    classification_result = ma.fields.Str(required=False)

class ErrorTypeSchema(ma.Schema):
    section = ma.fields.Str(required=True)
    message = ma.fields.Str(required=True)

class QueryParamsSchema(ma.Schema):
    skip = ma.fields.Int(required=False)
    order_by = ma.fields.Str(required=False)
    sort_by = ma.fields.Str(required=False)

class MetaSchema(ma.Schema):
    total = ma.fields.Int()

class GetMessages200Schema(ma.Schema):
    array = ma.fields.List(ma.fields.Nested(EncryptedMessageSchema), required=True)
    meta = ma.fields.Nested(MetaSchema, required=True)
