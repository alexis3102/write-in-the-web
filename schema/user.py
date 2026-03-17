from pydantic import BaseModel

class user_schema(BaseModel):
    NAME: str
    PASSWORD: str
    MAIL: str