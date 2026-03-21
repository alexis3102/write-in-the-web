from pydantic import BaseModel

class write_schema(BaseModel):
    title: str
    text: str