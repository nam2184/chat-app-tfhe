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

class MessageSchema(ma.Schema):
    id = ma.fields.Int(required=True)
    chat_id = ma.fields.Int(required=True)
    sender_id = ma.fields.Int(required=True)
    sender_name = ma.fields.Str(required=True)
    receiver_id = ma.fields.Int(required=True)
    content = ma.fields.Str(required=True)
    image = ma.fields.Raw(required=False)
    type = ma.fields.Str(required=True)
    is_typing = ma.fields.Bool(required=False)
    timestamp = ma.fields.DateTime(required=True)

class ErrorTypeSchema(ma.Schema):
    section = ma.fields.Str(required=True)
    message = ma.fields.Str(required=True)


