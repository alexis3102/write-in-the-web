
import json
from os import path
from typing import Annotated
from fastapi import FastAPI, Path
from pydantic import BaseModel

app = FastAPI()

class info(BaseModel):
    title: str
    text: str

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





