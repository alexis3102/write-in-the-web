# schema/chaterest.py

from pydantic import BaseModel
from typing import Optional

class chaterest_schema(BaseModel):
    name: str
    age: int
    personaly: str
    history: str

class search_chaterest_schema(BaseModel):
    name: str

class delete_chaterest_schema(BaseModel):
    name: str

# schema/chaterest.py
from typing import Optional

class update_chaterest_schema(BaseModel):
    name: str                          # para buscar (obligatorio)
    new_name: Optional[str] = None     # para cambiar (opcionales)
    new_age: Optional[int] = None
    new_personaly: Optional[str] = None
    new_history: Optional[str] = None