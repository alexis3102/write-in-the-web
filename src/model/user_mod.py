from sqlmodel import Field, SQLModel, create_engine

class user_model(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    #esta linea me quiere decir que como el id lo genera el backend y no el usuario, que mientras no llegue nada del usuario y mientras backend genera un id, que sea none por defecto
    NAME: str
    PASSWORD: str
    MAIL: str

sqlite_file_name = "user.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=True)

def create_db_user():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    create_db_user()