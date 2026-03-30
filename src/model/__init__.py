from .user_mod import engine
from . import user_mod, text_mod, chaterest_mod
from sqlmodel import SQLModel

def create_all_tables():
    # Crea TODAS las tablas en la misma base de datos
    SQLModel.metadata.create_all(engine)