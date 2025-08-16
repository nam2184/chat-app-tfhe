from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import datetime
from typing import Optional, List


class MessageModel(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    chat_id: int
    sender_id: int
    sender_name: str
    receiver_id: int
    content: Optional[str] = None
    image: Optional[str] = None
    type: str
    is_typing: bool = False
    timestamp: datetime
    classification_result: Optional[bool] = None


class DBService:
    def __init__(self, db_path: str = "sqlite:///messages.db"):
        self.engine = create_engine(db_path, echo=False)
        SQLModel.metadata.create_all(self.engine)

    def insert_message(self, message: MessageModel) -> MessageModel:
        with Session(self.engine) as session:
            session.add(message)
            session.commit()
            session.refresh(message)
            return message

    def get_messages_by_chat_id(self, chat_id: int) :
        with Session(self.engine) as session:
            statement = select(MessageModel).where(MessageModel.chat_id == chat_id)
            return session.exec(statement).all()

    def get_all_messages(self):
        with Session(self.engine) as session:
            return session.exec(select(MessageModel)).all()

    def delete_message_by_id(self, message_id: int) -> bool:
        with Session(self.engine) as session:
            message = session.get(MessageModel, message_id)
            if message:
                session.delete(message)
                session.commit()
                return True
            return False
