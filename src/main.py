from os import path
from typing import Annotated
from fastapi import FastAPI, Path
from pydantic import BaseModel
from sqlmodel import Session, select, col

from .schema.chaterest import chaterest_schema
from .schema.login import login_schema
from .schema.text import write_schema
from .schema.user import user_schema
from .model.user_mod import engine, user_model
from .model.text_mod import engine_text, text_model
from .model.chaterest_mod import engine_chaterest, chaterest_model, create_db_chterest

# Al inicio, antes de los endpoints:
create_db_chterest()


app = FastAPI()

#____________zone of write___________________________

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
    

@app.post("/chaterest/")
def people (chaterests: chaterest_schema):
    with Session(engine_chaterest) as session:
        db_chaterest = chaterest_model(
            name = chaterests.name,
            age = chaterests.age,
            personaly = chaterests.personaly,
            history = chaterests.history
        )

        session.add(db_chaterest)
        session.commit()
        session.refresh(db_chaterest)

        return db_chaterest

#_________________________login______________________

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

@app.post("/login/")
def login(login_user: login_schema):
    with Session(engine) as session:
        # 1. Buscamos UN registro que coincida en AMBAS cosas exactamente
        statement = select(user_model).where(
            user_model.NAME == login_user.NAME,
            user_model.PASSWORD == login_user.PASSWORD
        )
        
        # 2. .first() nos da el primer usuario encontrado o None si no hay ninguno
        user = session.exec(statement).first()

        # 3. Validamos
        if not user:
            return {"status": "error", "message": "Credenciales incorrectas"}
        
        return {"status": "success", "message": f"Bienvenido {user.NAME}", "user_id": user.ID}







from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

