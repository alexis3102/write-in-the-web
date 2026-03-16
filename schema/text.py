from pydantic import BaseModel

class info(BaseModel):
    title: str
    text: str