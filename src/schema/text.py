from pydantic import BaseModel

class write_schema(BaseModel):
    title: str
    text: str
    user_id: int

# en tu archivo de schemas
class write_search_schema(BaseModel):
    title: str
    user_id: int

class user_write_schema(BaseModel):
    user_id: int