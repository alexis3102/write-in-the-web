from pydantic import BaseModel

class write_schema(BaseModel):
    title: str
    text: str

# en tu archivo de schemas
class write_search_schema(BaseModel):
    title: str