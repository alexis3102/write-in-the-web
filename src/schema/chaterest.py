from pydantic import BaseModel

class chateres_schema(BaseModel):
    NAME: str
    AGE: int
    ROL: str
    PERSONALITY: str