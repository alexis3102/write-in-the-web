from sqlmodel import SQLModel, Field, create_engine
from typing import Optional

sqlite_url = "sqlite:///app.db"
engine = create_engine(sqlite_url)

class place_model(SQLModel, table=True):
    id:          Optional[int] = Field(default=None, primary_key=True)
    name:        str
    description: str
    danger:      int
    population:  int
    resources:   str
    user_id:     int
    image_path:  Optional[str] = Field(default=None)  # ← ruta de la imagen en disco

class search_place_schema(SQLModel):
    name:    str
    user_id: int

