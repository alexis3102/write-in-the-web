from sqlmodel import Field, SQLModel, create_engine

# ── Una sola base de datos para todo ──────────────────────
DATABASE_URL = "sqlite:///app.db"
engine = create_engine(DATABASE_URL, echo=True)

class user_model(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    NAME: str
    PASSWORD: str
    MAIL: str