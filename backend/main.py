from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.models import User
from backend.database import engine, Base, SessionLocal

app = FastAPI()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    name: str
    email: str
    password: str


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(name= user.name, email= user.email, password= user.password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user