from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select
import os, shutil
from uuid import uuid4
from fastapi import UploadFile, File, Form
from fastapi.staticfiles import StaticFiles

from .sytem.jwt_auth import create_access_token, verify_token, is_admin_token

from .model.user_mod import engine, user_model
from .model.text_mod import text_model
from .model.chaterest_mod import chaterest_model
from .model.place_mod import place_model, search_place_schema
from .model import create_all_tables

from .schema.text import write_schema, write_search_schema, user_write_schema
from .schema.chaterest import (
    chaterest_schema, search_chaterest_schema,
    delete_chaterest_schema, update_chaterest_schema, user_chaterest_schema
)
from .schema.login import login_schema
from .schema.user import user_schema
from .schema.place import (
    place_schema, place_search_schema, update_place_schama,
    place_delete_schema, place_name_schema
)
from .schema.admit import (
    search_admit_schema,updata_admit_schema,delete_admit_schema
)
from .schema.token import token_schema 
from .password import ADMIN_NAME, ADMIN_PASS


from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


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

# ── HTTPBearer: extrae el token del Header automáticamente ─────
# Cuando un endpoint lo usa como dependencia, FastAPI lee el Header
#   Authorization: Bearer <token>
# y lo pasa como objeto HTTPAuthorizationCredentials.
bearer_scheme = HTTPBearer()


# Sirve todos los archivos estáticos del frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Ruta raíz → devuelve index.html
@app.get("/")
def root():
    return FileResponse("frontend/index.html")

@app.get("/html/login.html")
def login_page():
    return FileResponse("frontend/html/login.html")

@app.get("/html/write.html")
def write_page():
    return FileResponse("frontend/html/write.html")

@app.get("/html/admit.html")
def admit_page():
    return FileResponse("frontend/html/admit.html")

@app.get("/register.html")
def register_page():
    return FileResponse("frontend/register.html")

app.mount("/static", StaticFiles(directory="frontend"), name="static")

# ══════════════════════════════════════════════════════════════
#  DEPENDENCIAS  (funciones que FastAPI inyecta en los endpoints)
# ══════════════════════════════════════════════════════════════
 
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """
    Dependencia para endpoints que requieren usuario autenticado.
    
    FastAPI llama a esta función automáticamente cuando el endpoint
    la declara en su firma con  Depends(get_current_user).
    
    Devuelve el payload del token si es válido.
    Lanza 401 si no lo es.
    """
    token = credentials.credentials  # extrae solo el string del token
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload  # { "sub": "3", "role": "user", "exp": ... }
 
 
def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """
    Dependencia para endpoints que requieren rol de administrador.
    Llama a get_current_user y además verifica el rol.
    """
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return payload
 
 

# ── Carpeta de imágenes ────────────────────────────────────
IMG_FOLDER = "src/img_place"
os.makedirs(IMG_FOLDER, exist_ok=True)
app.mount("/images", StaticFiles(directory=IMG_FOLDER), name="images")


# ── USUARIOS ───────────────────────────────────────────────

@app.post("/user/", tags=['usuario'])
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

@app.post("/login/", response_model=token_schema, tags=['usuario'])
def login(login_user: login_schema):
    """
    Verifica credenciales y devuelve un JWT.
    El token incluye el ID del usuario y su rol en el PAYLOAD.
    """
 
    # ── Caso admin hardcodeado ────────────────────────────────
    if login_user.NAME == ADMIN_NAME and login_user.PASSWORD == ADMIN_PASS:
        token = create_access_token({
            "sub": "0",       # ID 0 = admin (convención tuya)
            "role": "admin"   # rol que usaremos para proteger rutas
        })
        return {"access_token": token, "token_type": "bearer", "user_id": 0, "role": "admin"}
 
    # ── Caso usuario normal ───────────────────────────────────
    with Session(engine) as session:
        statement = select(user_model).where(
            user_model.NAME == login_user.NAME,
            user_model.PASSWORD == login_user.PASSWORD
        )
        user = session.exec(statement).first()
 
        if not user:
            # 401 = No autorizado (credenciales incorrectas)
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
 
        # Creamos el token con el ID y el rol del usuario
        token = create_access_token({
            "sub": str(user.ID),   # "sub" = subject (estándar JWT)
            "role": "user"
        })
 
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.ID,
            "role": "user"
        }
 
# ── Ejemplo: endpoint PROTEGIDO para usuario normal ──────────
@app.get("/me/", tags=['usuario'])
def get_my_info(payload: dict = Depends(get_current_user)):
    """
    Solo accesible con un token válido.
    
    El parámetro  payload: dict = Depends(get_current_user)
    hace que FastAPI ejecute get_current_user() automáticamente.
    Si el token falla → 401 antes de entrar aquí.
    Si es válido      → payload contiene los datos del token.
    """
    user_id = int(payload["sub"])
    role    = payload["role"]
    return {"message": f"Hola usuario {user_id}", "tu_rol": role}
        


#── ADMIT ─────────────────────────────────────────────────────

# ── Ejemplo: endpoint PROTEGIDO solo para admin ───────────────
@app.get("/all_user_admit/", tags=['admit'])
def all_user(payload: dict = Depends(get_current_admin)):
    """
    Solo accesible si el token tiene role == "admin".
    Si el token es de usuario normal → 403 Forbidden.
    """
    with Session(engine) as session:
        result = session.exec(select(user_model)).all()
        if not result:
            return {"status": "error", "message": "No hay usuarios"}
        return {"status": "success", "data": result}
    
@app.post("/search_admit/", tags=['admit'])
def search_user(data: search_admit_schema):
    with Session(engine) as session:
        query = select(user_model)
        if data.ID is not None:
            query = query.where(user_model.ID == data.ID)
        if data.NAME is not None:
            query = query.where(user_model.NAME == data.NAME)
        result = session.exec(query).first()
        if not result:
            return {"status": "error", "message": "No existe usuario"}
        return {"status": "ok", "data": {
            "id": result.ID,
            "name": result.NAME,
            "password": result.PASSWORD,
            "gmail": result.MAIL
        }}
    
@app.put("/update_user/", tags=['admit'])
def update_user(data: updata_admit_schema):
    with Session(engine) as session:
        querry = select(user_model).where(
            user_model.ID == data.ID
        )
        result = session.exec(querry).first()
        if not result:
            return{"status": "error", "message": "No existe usuario"}
        if data.NEW_NAME is not None: result.NAME = data.NEW_NAME
        if data.NEW_PASSWORD is not None: result.PASSWORD = data.NEW_PASSWORD
        if data.NEW_MAIL is not None: result.MAIL = data.NEW_MAIL

        session.add(result)
        session.commit()
        return {"status": "ok", "message": "usuario actualizado"}

@app.delete("/dalete_user/", tags=['admit'])
def delete_user(data: delete_admit_schema):
    with Session(engine) as session:
        querry = select(user_model).where(
            user_model.ID == data.ID
        )
        result = session.exec(querry).first()
        if not result:
            return {"status": "error", "message": "No existe usuario"}
        session.delete(result)
        session.commit()
        return {"status": "ok", "message": f"'{data.ID}' eliminado"}
# ── TEXTOS ─────────────────────────────────────────────────

@app.post("/write/", tags=['write'])
def write(write: write_schema):
    with Session(engine) as session:
        db_text = text_model(
            title=write.title,
            text=write.text,
            user_id=write.user_id
        )
        session.add(db_text)
        session.commit()
        session.refresh(db_text)
        return db_text

@app.post("/search_write/", tags=['write'])
def search_write(write2: write_search_schema):
    with Session(engine) as session:
        search = select(text_model).where(
            text_model.title == write2.title,
            text_model.user_id == write2.user_id
        )
        result = session.exec(search).first()
        if not result:
            return {"status": "error", "message": "No existe o no te pertenece"}
        return {"status": "ok", "data": {"title": result.title, "text": result.text}}

@app.post("/names_text/", tags=['write'])
def names_text(data: user_write_schema):
    with Session(engine) as session:
        query = select(text_model).where(
            text_model.user_id == data.user_id
        )
        results = session.exec(query).all()
        if not results:
            return {"status": "error", "message": "No existen textos"}
        return [item.title for item in results]


# ── PERSONAJES ─────────────────────────────────────────────

@app.post("/chaterest/", tags=['chaterest'])
def create_chaterest(chaterests: chaterest_schema):
    with Session(engine) as session:
        db_ch = chaterest_model(
            name=chaterests.name,
            age=chaterests.age,
            personaly=chaterests.personaly,
            history=chaterests.history,
            user_id=chaterests.user_id
        )
        session.add(db_ch)
        session.commit()
        session.refresh(db_ch)
        return db_ch

@app.post("/search_chaterest/", tags=['chaterest'])
def search_chaterest(data: search_chaterest_schema):
    with Session(engine) as session:
        search = select(chaterest_model).where(
            chaterest_model.name == data.name,
            chaterest_model.user_id == data.user_id
        )
        res = session.exec(search).first()
        if not res:
            return {"status": "error", "message": "No existe o no te pertenece"}
        return {"status": "ok", "data": {
            "name": res.name, "age": res.age,
            "personaly": res.personaly, "history": res.history
        }}

@app.post("/names_chaterest/", tags=['chaterest'])
def names_chaterest(data: user_chaterest_schema):
    with Session(engine) as session:
        query = select(chaterest_model).where(
            chaterest_model.user_id == data.user_id
        )
        results = session.exec(query).all()
        if not results:
            return {"status": "error", "message": "No existen personajes"}
        return [item.name for item in results]

@app.put("/update_chaterest/", tags=['chaterest'])
def update_chaterest(data: update_chaterest_schema):
    with Session(engine) as session:
        search = select(chaterest_model).where(
            chaterest_model.name == data.name,
            chaterest_model.user_id == data.user_id
        )
        personaje = session.exec(search).first()
        if not personaje:
            return {"status": "error", "message": "No encontrado o no te pertenece"}

        if data.new_name     is not None: personaje.name     = data.new_name
        if data.new_age      is not None: personaje.age      = data.new_age
        if data.new_personaly is not None: personaje.personaly = data.new_personaly
        if data.new_history  is not None: personaje.history  = data.new_history

        session.add(personaje)
        session.commit()
        return {"status": "ok", "message": "Personaje actualizado"}

@app.delete("/delete_chaterest/", tags=['chaterest'])
def delete_chaterest(data: delete_chaterest_schema):
    with Session(engine) as session:
        search = select(chaterest_model).where(
            chaterest_model.name == data.name,
            chaterest_model.user_id == data.user_id
        )
        personaje = session.exec(search).first()
        if not personaje:
            return {"status": "error", "message": "No encontrado o no te pertenece"}
        session.delete(personaje)
        session.commit()
        return {"status": "ok", "message": f"'{data.name}' eliminado"}


# ── LUGARES ────────────────────────────────────────────────

@app.post("/place/", tags=['place'])
async def create_place(
    name:        str        = Form(...),
    description: str        = Form(...),
    danger:      int        = Form(...),
    population:  int        = Form(...),
    resources:   str        = Form(...),
    user_id:     int        = Form(...),
    image:       UploadFile = File(None),
):
    image_path = None

    if image and image.filename:
        allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if image.content_type not in allowed:
            return {"status": "error", "message": "Formato no permitido. Usa JPG, PNG, WEBP o GIF"}

        ext         = image.filename.rsplit(".", 1)[-1].lower()
        unique_name = f"user_{user_id}_{uuid4().hex}.{ext}"
        file_path   = os.path.join(IMG_FOLDER, unique_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        image_path = file_path

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
                "id":        db_pl.id,
                "name":      db_pl.name,
                "image_url": f"/images/{os.path.basename(image_path)}" if image_path else None,
            }
        }

@app.post("/search_place/", tags=['place'])
def search_place(data: place_search_schema):
    with Session(engine) as session:
        search = select(place_model).where(
            place_model.name    == data.name,
            place_model.user_id == data.user_id
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
                "image_url": (
                    f"/images/{os.path.basename(resultado.image_path)}"
                    if resultado.image_path else None
                ),
            }
        }

@app.post("/names_place/", tags=['place'])
def names_place(data: place_name_schema):
    with Session(engine) as session:
        query = select(place_model).where(
            place_model.user_id == data.user_id
        )
        results = session.exec(query).all()
        if not results:
            return {"status": "error", "message": "No existen lugares"}
        return [item.name for item in results]

@app.put("/update_place/", tags=['place'])
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

@app.delete("/delete_place/", tags=['place'])
def delete_place(data: place_delete_schema):
    with Session(engine) as session:
        search = select(place_model).where(
            place_model.name    == data.name,
            place_model.user_id == data.user_id
        )
        place = session.exec(search).first()
        if not place:
            return {"status": "error", "message": "No encontrado o no te pertenece"}

        if place.image_path and os.path.exists(place.image_path):
            os.remove(place.image_path)

        session.delete(place)
        session.commit()
        return {"status": "ok", "message": f"'{data.name}' eliminado"}


