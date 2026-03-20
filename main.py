import json
from os import path
from typing import Annotated
from fastapi import FastAPI, Path
from pydantic import BaseModel
import random
from sqlmodel import Session

from schema.text import info
from schema.user import user_schema
from model.user_mod import engine, user_model

app = FastAPI()


@app.post("/escritura/{id_Escritura}")
async def write (Info: info, id_Escritura:Annotated[int,Path(gt=0, lt=100)]):
    data = Info.dict()

    data["id"] = id_Escritura

    with open("text.json", "w") as archivo:
        json.dump(data, archivo, indent=4)

    return {
        "id": id_Escritura,
        "data": data
    }

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