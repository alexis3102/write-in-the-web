from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .model.user_mod import engine, user_model
from .model.text_mod import text_model
from .model.chaterest_mod import chaterest_model
from .model.place_mod import place_model, search_place_schema
from .model import create_all_tables

from .schema.text import write_schema, write_search_schema
from .schema.chaterest import (
    chaterest_schema, search_chaterest_schema,
    delete_chaterest_schema, update_chaterest_schema
)
from .schema.login import login_schema
from .schema.user import user_schema
from .schema.place import (
    place_schema, place_search_schema, update_place_schama, place_delete_schema
    )

# Crea todas las tablas al iniciar
create_all_tables()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── USUARIOS ────────────────────────────────────────────────

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
        statement = select(user_model).where(
            user_model.NAME == login_user.NAME,
            user_model.PASSWORD == login_user.PASSWORD
        )
        user = session.exec(statement).first()
        if not user:
            return {"status": "error", "message": "Credenciales incorrectas"}
        # ← El frontend guarda este user_id y lo manda en cada request
        return {"status": "success", "message": f"Bienvenido {user.NAME}", "user_id": user.ID}


# ── TEXTOS ──────────────────────────────────────────────────

@app.post("/write/")
def write(write: write_schema):
    # write_schema ahora incluye user_id
    with Session(engine) as session:
        db_text = text_model(
            title=write.title,
            text=write.text,
            user_id=write.user_id  # ← guardamos el dueño
        )
        session.add(db_text)
        session.commit()
        session.refresh(db_text)
        return db_text

@app.post("/search_write/")
def search_write(write2: write_search_schema):
    # write_search_schema ahora incluye user_id
    with Session(engine) as session:
        search = select(text_model).where(
            text_model.title == write2.title,
            text_model.user_id == write2.user_id  # ← solo el dueño puede verlo
        )
        result = session.exec(search).first()
        if not result:
            return {"status": "error", "message": "No existe o no te pertenece"}
        return {"status": "ok", "data": {"title": result.title, "text": result.text}}


# ── PERSONAJES ──────────────────────────────────────────────

@app.post("/chaterest/")
def create_chaterest(chaterests: chaterest_schema):
    with Session(engine) as session:
        db_ch = chaterest_model(
            name=chaterests.name,
            age=chaterests.age,
            personaly=chaterests.personaly,
            history=chaterests.history,
            user_id=chaterests.user_id  # ← guardamos el dueño
        )
        session.add(db_ch)
        session.commit()
        session.refresh(db_ch)
        return db_ch

@app.post("/search_chaterest/")
def search_chaterest(data: search_chaterest_schema):
    with Session(engine) as session:
        search = select(chaterest_model).where(
            chaterest_model.name == data.name,
            chaterest_model.user_id == data.user_id  # ← filtro por dueño
        )
        res = session.exec(search).first()
        if not res:
            return {"status": "error", "message": "No existe o no te pertenece"}
        return {"status": "ok", "data": {
            "name": res.name, "age": res.age,
            "personaly": res.personaly, "history": res.history
        }}

@app.put("/update_chaterest/")
def update_chaterest(data: update_chaterest_schema):
    with Session(engine) as session:
        search = select(chaterest_model).where(
            chaterest_model.name == data.name,
            chaterest_model.user_id == data.user_id  # ← solo el dueño puede editar
        )
        personaje = session.exec(search).first()
        if not personaje:
            return {"status": "error", "message": "No encontrado o no te pertenece"}

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
        return {"status": "ok", "message": "Personaje actualizado"}

@app.delete("/delete_chaterest/")
def delete_chaterest(data: delete_chaterest_schema):
    with Session(engine) as session:
        search = select(chaterest_model).where(
            chaterest_model.name == data.name,
            chaterest_model.user_id == data.user_id  # ← solo el dueño puede borrar
        )
        personaje = session.exec(search).first()
        if not personaje:
            return {"status": "error", "message": "No encontrado o no te pertenece"}

        session.delete(personaje)
        session.commit()
        return {"status": "ok", "message": f"'{data.name}' eliminado"}

# ── place ───────────────────────────────────────────────────

"""
Reemplaza TODA la sección de places en tu main.py.
Incluye los imports nuevos al tope del archivo si aún no los tienes.
"""

# ── Imports adicionales necesarios (agregar al tope de main.py si faltan) ──────
import os, shutil
from uuid import uuid4
from fastapi import UploadFile, File, Form
from fastapi.staticfiles import StaticFiles

# ── Carpeta de imágenes ─────────────────────────────────────────────────────────
IMG_FOLDER = "src/img_place"
os.makedirs(IMG_FOLDER, exist_ok=True)

# Expone la carpeta como URL pública → http://localhost:8000/images/<archivo>
# (Agregar esta línea justo después de crear el app, una sola vez)
app.mount("/images", StaticFiles(directory=IMG_FOLDER), name="images")


# ══════════════════════════════════════════════════════════════════════════════
#  LUGARES
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/place/")
async def create_place(
    name:        str           = Form(...),
    description: str           = Form(...),
    danger:      int           = Form(...),
    population:  int           = Form(...),
    resources:   str           = Form(...),
    user_id:     int           = Form(...),
    image:       UploadFile    = File(None),   # ← opcional
):
    image_path = None

    if image and image.filename:
        allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if image.content_type not in allowed:
            return {"status": "error", "message": "Formato no permitido. Usa JPG, PNG, WEBP o GIF"}

        ext         = image.filename.rsplit(".", 1)[-1].lower()
        # Nombre único que incluye user_id → imposible mezclar usuarios
        unique_name = f"user_{user_id}_{uuid4().hex}.{ext}"
        file_path   = os.path.join(IMG_FOLDER, unique_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        image_path = file_path   # guardamos la ruta en la DB

    with Session(engine) as session:
        db_pl = place_model(
            name        = name,
            description = description,
            danger      = danger,
            population  = population,
            resources   = resources,
            user_id     = user_id,
            image_path  = image_path,
        )
        session.add(db_pl)
        session.commit()
        session.refresh(db_pl)

        return {
            "status": "ok",
            "data": {
                "id":          db_pl.id,
                "name":        db_pl.name,
                "image_url":   f"/images/{os.path.basename(image_path)}" if image_path else None,
            }
        }


@app.post("/search_place/")
def search_place(data: place_search_schema):
    with Session(engine) as session:
        search = select(place_model).where(
            place_model.name    == data.name,
            place_model.user_id == data.user_id   # ← solo el dueño puede verlo
        )
        resultado = session.exec(search).first()

        if not resultado:
            return {"status": "error", "message": "No existe o no te pertenece"}

        return {
            "status": "ok",
            "data": {
                "name":        resultado.name,
                "description": resultado.description,
                "danger":      resultado.danger,
                "population":  resultado.population,
                "resources":   resultado.resources,
                # La URL que el frontend usará en <img src="...">
                "image_url":   (
                    f"/images/{os.path.basename(resultado.image_path)}"
                    if resultado.image_path else None
                ),
            }
        }


@app.put("/update_place/")
def update_place(data: update_place_schama):
    with Session(engine) as session:
        search = select(place_model).where(
            place_model.name    == data.name,
            place_model.user_id == data.user_id
        )
        place = session.exec(search).first()
        if not place:
            return {"status": "error", "message": "No encontrado o no te pertenece"}

        if data.name_new        is not None: place.name        = data.name_new
        if data.description_new is not None: place.description = data.description_new
        if data.danger_new      is not None: place.danger      = data.danger_new
        if data.population_new  is not None: place.population  = data.population_new
        if data.resources_new   is not None: place.resources   = data.resources_new

        session.add(place)
        session.commit()
        return {"status": "ok", "message": "Lugar actualizado"}


@app.delete("/delete_place/")
def delete_place(data: place_delete_schema):
    with Session(engine) as session:
        search = select(place_model).where(
            place_model.name    == data.name,
            place_model.user_id == data.user_id
        )
        place = session.exec(search).first()
        if not place:
            return {"status": "error", "message": "No encontrado o no te pertenece"}

        # Borrar imagen del disco si existe
        if place.image_path and os.path.exists(place.image_path):
            os.remove(place.image_path)

        session.delete(place)
        session.commit()
        return {"status": "ok", "message": f"'{data.name}' eliminado"}