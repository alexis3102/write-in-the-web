from sqlmodel import Field, SQLModel, create_engine

class text_model(SQLModel, table=True):
    ID : int | None = Field(default=None, primary_key=True)
    title: str
    text: str

sqlite_text_name = "text.db"
sqlite_text_url = f"sqlite:///{sqlite_text_name}"

engine_text = create_engine(sqlite_text_url, echo=True)

SQLModel.metadata.create_all(engine_text)