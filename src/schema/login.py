from pydantic import BaseModel

class login_schema(BaseModel):
    NAME: str
    PASSWORD: str