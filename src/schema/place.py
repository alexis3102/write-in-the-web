from sqlmodel import SQLModel
from typing import Optional

# ── Crear lugar (ahora sin image, la imagen llega por Form en el endpoint) ──
# Se usa como referencia; el endpoint real usa Form() directamente.
class place_schema(SQLModel):
    name:        str
    description: str
    danger:      int
    population:  int
    resources:   str
    user_id:     int

class place_search_schema(SQLModel):
    name:    str
    user_id: int

class update_place_schama(SQLModel):
    name:            str
    user_id:         int
    name_new:        Optional[str] = None
    description_new: Optional[str] = None
    danger_new:      Optional[int] = None
    population_new:  Optional[int] = None
    resources_new:   Optional[str] = None

class place_delete_schema(SQLModel):
    name:    str
    user_id: int


