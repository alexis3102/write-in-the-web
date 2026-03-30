from sqlmodel import Field, SQLModel
from .user_mod import engine  # ← mismo engine

class chaterest_model(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    name: str
    age: int
    personaly: str
    history: str
    # ↓ Apunta al dueño del personaje
    user_id: int = Field(foreign_key="user_model.ID")