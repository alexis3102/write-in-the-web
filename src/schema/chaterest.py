# schema/chaterest.py

from pydantic import BaseModel
from typing import Optional

class chaterest_schema(BaseModel):
    name: str
    age: int
    personaly: str
    history: str
    user_id: int

class search_chaterest_schema(BaseModel):
    name: str
    user_id: int

class delete_chaterest_schema(BaseModel):
    name: str
    user_id: int

class user_chaterest_schema(BaseModel):
    user_id: int

# schema/chaterest.py
from typing import Optional

class update_chaterest_schema(BaseModel):
    name: str                          # para buscar (obligatorio)
    user_id: int                       # ← AGREGAR: para que solo tú puedas editar el tuyo
    new_name: Optional[str] = None     # para cambiar (opcionales)
    new_age: Optional[int] = None
    new_personaly: Optional[str] = None
    new_history: Optional[str] = None