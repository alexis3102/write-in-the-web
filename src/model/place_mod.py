from sqlmodel import Field, SQLModel
from .user_mod import engine  # ← mismo engine

class place_model(SQLModel, table=True):
    ID : int | None = Field(default=None, primary_key=True)
    name: str
    description: str
    danger: int 
    population: int
    resources: int
    user_id: int = Field(foreign_key="user_model.ID")

class search_place_schema(SQLModel):
    name: str
    user_id: int

