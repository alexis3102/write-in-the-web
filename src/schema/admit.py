from pydantic import BaseModel
from typing import Optional

class search_admit_schema(BaseModel):
    ID: Optional[int] = None
    NAME: Optional[str] = None

class updata_admit_schema(BaseModel):
    ID: int                        #para buscar al usuario
    NAME: Optional[str] = None     #para buscar el usuario
    NEW_NAME: Optional[str] = None
    NEW_PASSWORD: Optional[str] = None
    NEW_MAIL: Optional[str] = None

class delete_admit_schema(BaseModel):
    ID: int                         #para buscar al usuario
