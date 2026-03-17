import json
from os import path
from typing import Annotated
from fastapi import FastAPI, Path
from pydantic import BaseModel
import random

from schema.text import info
from schema.user import user_schema

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
async def users (USER_POINT: user_schema):
    user_data = USER_POINT.dict()

    ID_user = []

    for V in range(5):
        numeros_random = random.randint(1, 10)
        ID_user.append(numeros_random)

    user_data["id_user"] = ID_user

    with open ("user.json", "w") as archivo:
        json.dump(user_data, archivo, indent=4)
    
    return {
        "your info:" : user_data
    }