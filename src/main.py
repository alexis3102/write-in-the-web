from os import path
from typing import Annotated
from fastapi import FastAPI, Path
from pydantic import BaseModel
from sqlmodel import Session, select, col

from .schema.chaterest import chaterest_schema, search_chaterest_schema,delete_chaterest_schema,update_chaterest_schema
from .schema.login import login_schema
from .schema.text import write_schema, write_search_schema
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
    
@app.post("/search_write/")
def search_write (write2: write_search_schema):
    with Session(engine_text) as session_text:
        search = select(text_model).where(
            text_model.title == write2.title
        )
        title_search = session_text.exec(search).first()

        if not title_search:
            return {"status": "error", "message": "No existe texto con ese título"}
        
        # IMPORTANTE: Enviamos 'data' con los campos específicos
        return {
            "status": "ok", 
            "data": {
                "title": title_search.title,
                "text": title_search.text
            }
        }
    





#___________________________chaterest__________________________________________________

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

@app.post("/search_chaterest/")
def search_chaterest(chaterest2: search_chaterest_schema):
    with Session(engine_chaterest) as session:
        search = select(chaterest_model).where(chaterest_model.name == chaterest2.name)
        res = session.exec(search).first()
        if not res:
            return {"status": "error", "message": "no existe personaje"}
        return {
            "status": "ok", 
            "data": {"name": res.name, "age": res.age, "personaly": res.personaly, "history": res.history}
        }

# ── ACTUALIZAR ──────────────────────────────────────────────
@app.put("/update_chaterest/")
def update_chaterest(data: update_chaterest_schema):
    with Session(engine_chaterest) as session:

        search = select(chaterest_model).where(
            chaterest_model.name == data.name
        )
        personaje = session.exec(search).first()

        if not personaje:
            return {"status": "error", "message": "Personaje no encontrado"}

        if data.new_name is not None:
            personaje.name = data.new_name
        if data.new_age is not None:
            personaje.age = data.new_age
        if data.new_personaly is not None:
            personaje.personaly = data.new_personaly
        if data.new_history is not None:
            personaje.history = data.new_history

        session.add(personaje)
        session.commit()

        # ← SIN session.refresh() — ese era el problema
        return {"status": "ok", "message": "Personaje actualizado"}


# ── ELIMINAR ────────────────────────────────────────────────
@app.delete("/delete_chaterest/")
def delete_chaterest(data: delete_chaterest_schema):
    with Session(engine_chaterest) as session:

        # 1. Buscamos el personaje
        search = select(chaterest_model).where(
            chaterest_model.name == data.name
        )
        personaje = session.exec(search).first()

        # 2. Si no existe, avisamos
        if not personaje:
            return {"status": "error", "message": "Personaje no encontrado"}

        # 3. Lo eliminamos de la base de datos
        session.delete(personaje)
        session.commit()

        return {"status": "ok", "message": f"Personaje '{data.name}' eliminado correctamente"}

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

