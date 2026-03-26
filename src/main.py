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
from .schema.chaterest import chateres_schema
import google.generativeai as genai

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


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


genai.configure(api_key="AIzaSyD0IKmTfu1Q_GIO1ulfe85PDRNhUiAIZ-M")

# 2. Elegir el modelo (Es mejor inicializarlo fuera del endpoint para no recrearlo en cada petición)
model = genai.GenerativeModel('gemini-1.5-flash')

@app.post("/gemini/")
def ia(chaterest: chateres_schema):
    
    # 3. Armar el prompt extrayendo los datos del objeto Pydantic
    prompt = f"""
    Actúa como un Narrador Maestro de RPG de Fantasía Oscura y Guionista de Anime Seinen. 
    Tu objetivo es crear una ficha de personaje legendaria y una breve historia de origen épica.

    DATOS DEL PERSONAJE:
    - Nombre: {chaterest.NAME}
    - Edad: {chaterest.AGE} años
    - Rol/Clase: {chaterest.ROL}
    - Personalidad base: {chaterest.PERSONALITY}

    ESTILO REQUERIDO:
    - Tono: Oscuro, visceral, melancólico pero heroico (estilo Berserk o Dark Souls).
    - Ambientación: Medieval cruel, donde la magia tiene un precio y el mundo es hostil.
    - Narrativa: Usa descripciones sensoriales (el olor a azufre, el frío del acero, el peso de los pecados).

    ESTRUCTURA DE LA RESPUESTA (Usa Markdown):
    1. **Título Épico**: Un epíteto para el personaje.
    2. **Apariencia**: Describe su equipo, cicatrices y mirada en estilo anime detallado.
    3. **Origen Oscuro**: Una historia breve de un evento traumático o épico que definió su destino.
    4. **Habilidad Especial**: Un poder o técnica con un nombre impactante y su costo físico/mental.
    5. **Frase Icónica**: Algo que diría el personaje antes de una batalla inevitable.
    """

    # 4. Enviar la instrucción al modelo
    response = model.generate_content(prompt)

    # 5. Retornar el resultado como un JSON
    return {"personaje_generado": response.text}