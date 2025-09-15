from sqlmodel import SQLModel, Field, create_engine, Session, select
from typing import Optional

class ClientHEModel(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(index=True, unique=True)
    dir_number: int

class DBService:
    def __init__(self, db_path: str = "sqlite:///clients.db"):
        self.engine = create_engine(db_path, echo=False)
        SQLModel.metadata.create_all(self.engine)

    def insert_client(self, client: ClientHEModel) -> ClientHEModel:
        with Session(self.engine) as session:
            session.add(client)
            session.commit()
            session.refresh(client)
            return client

    def get_client_by_chat_id(self, chat_id: int) -> Optional[ClientHEModel]:
        with Session(self.engine) as session:
            statement = select(ClientHEModel).where(ClientHEModel.chat_id == chat_id)
            return session.exec(statement).first()

    def get_all_clients(self) -> list[ClientHEModel]:
        with Session(self.engine) as session:
            return session.exec(select(ClientHEModel)).all()

    def delete_client_by_chat_id(self, chat_id: int) -> bool:
        with Session(self.engine) as session:
            client = session.exec(select(ClientHEModel).where(ClientHEModel.chat_id == chat_id)).first()
            if client:
                session.delete(client)
                session.commit()
                return True
            return False

