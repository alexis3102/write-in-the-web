import json
from os import path
from typing import Annotated
from fastapi import FastAPI, Path
from pydantic import BaseModel
import random
from sqlmodel import Session


from .schema.text import write_schema
from .schema.user import user_schema
from .model.user_mod import engine, user_model
from .model.text_mod import engine_text, text_model

app = FastAPI()


@app.post("/write/")
def write (write: write_schema):
    with Session(engine_text) as pueblito:
        db_text = text_model (
            title=write.title,
            text=write.text
        )

        pueblito.add(db_text)
        pueblito.commit()
        pueblito.refresh(db_text)

        return db_text


@app.post("/user/")
def create_user(user: user_schema):
    with Session(engine) as session:
        db_user = user_model(
            NAME=user.NAME,
            PASSWORD=user.PASSWORD,
            MAIL=user.MAIL
        )

        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        return db_user