from pydantic import BaseModel

class chaterest_schema(BaseModel):
    name: str
    age: int
    personaly: str
    history: str