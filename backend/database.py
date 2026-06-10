import os
from dotenv import load_dotenv
from sqlmodel import create_engine, SQLModel, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./runs.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def get_session():
    with Session(engine) as session:
        yield session


def init_db():
    SQLModel.metadata.create_all(engine)
