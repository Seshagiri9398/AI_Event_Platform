from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, datetime, timedelta

from backend.models import User, Event
from backend.database import engine, Base, SessionLocal

app = FastAPI()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#pydantics
class UserCreate(BaseModel):
    name     : str
    email    : str
    password : str

class EventCreate(BaseModel):
    title         : str
    description   : str
    date          : datetime 
    location      : str
    capacity      : int
    organizer_id  : int    


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()



@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        name     = user.name, 
        email    = user.email, 
        password = user.password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/events")
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    new_event = Event(
        title        = event.title,
        description  = event.description,
        date         = event.date,
        location     = event.location,
        capacity     = event.capacity,
        organizer_id = event.organizer_id,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event

@app.get("/events")
def get_users(db: Session = Depends(get_db)):
    return db.query(Event).all()


@app.get("/events/search")
def search_events(
    title     :str = None, 
    location  :str = None, 
    status    :str = None,
    date      :date = None,
    db        :Session = Depends(get_db)):

    query = db.query(Event)

    if title:
        query = query.filter(Event.title.ilike(f"%{title}%"))

    if location:
        query = query.filter(Event.location.ilike(f"%{location}%"))
    if status:
        query = query.filter(Event.status.ilike(f"%{status}%"))

    if date:
        start = datetime.combine(date, datetime.min.time())
        end   = start + timedelta(days=1)

        query = query.filter(Event.date >= start, Event.date < end)
        
    events = query.all()

    return events


@app.get("/events/{event_id}")
def get_event(event_id:int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.event_id == event_id).first()

    if event is None:
        return {"Event not found"}
    return event


@app.put("/events/{event_id}")
def update_event(
    event_id: int,
    event: EventCreate,
    db: Session = Depends(get_db)
):

    existing_event = (db.query(Event).filter(Event.event_id == event_id).first())

    if existing_event is None:
        return {"message": "Event not found"}

    existing_event.title        = event.title
    existing_event.description  = event.description
    existing_event.date         = event.date
    existing_event.location     = event.location
    existing_event.capacity     = event.capacity
    existing_event.organizer_id = event.organizer_id

    db.commit()
    db.refresh(existing_event)

    return existing_event


@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = (db.query(Event).filter(Event.event_id == event_id).first())

    if event is None:
        return {"message": "Event not found"}

    db.delete(event)
    db.commit()

    return {"massage": "Event deleted successlly"}

