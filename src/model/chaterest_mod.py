from sqlmodel import Field, SQLModel, create_engine

class chaterest_model(SQLModel, table=True):
    ID : int | None = Field(default=None, primary_key=True)
    name: str
    age: int
    personaly: str
    history: str

sqlite_text_name = "chaterest.db"
sqlite_text_url = f"sqlite:///{sqlite_text_name}"

engine_chaterest = create_engine(sqlite_text_url, echo=True)

def create_db_chterest():
    SQLModel.metadata.create_all(engine_chaterest)

if __name__ == "__main__":
    create_db_chterest()