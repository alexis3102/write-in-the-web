from sqlmodel import Field, SQLModel
from .user_mod import engine  # ← mismo engine, misma base de datos

class text_model(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    title: str
    text: str
    # ↓ Esta columna es la clave: apunta al dueño del texto
    user_id: int = Field(foreign_key="user_model.ID")