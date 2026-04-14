from pydantic import BaseModel
from typing import Optional

class place_schema(BaseModel):
    name: str
    description: str
    danger: int 
    population: int
    resources: int
    user_id: int

class place_search_schema(BaseModel):
    name: str
    user_id: int

class place_delete_schema(BaseModel):
    name:str
    user_id:int

class update_place_schama(BaseModel):
    name: str
    user_id: int
    name_new: Optional[str] = None
    description_new: Optional[str] = None
    danger_new: Optional[int] = None 
    population_new: Optional[int] = None
    resources_new: Optional[int] = None
    user_id_new: Optional[int] = None


