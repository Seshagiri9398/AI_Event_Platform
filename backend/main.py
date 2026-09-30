from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, datetime, timedelta

from backend.models import User, Event, Attendee, Community, CommunityMember, Discussion
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

class RegistrationCreate(BaseModel):
    user_id : int


class CommunityCreate(BaseModel):
    name         : str
    description  : str
    creator_id   : int


class CommunityJoin(BaseModel):
    user_id : int



class DiscussionCreate(BaseModel):
    user_id : int
    content : str


class DiscussionUpdate(BaseModel):
    user_id : int
    content : str


class DiscussionDelete(BaseModel):
    user_id : int



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

@app.post("/events/{event_id}/register")
def register_event(event_id: int, registration: RegistrationCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == registration.user_id).first()

    if user is None:
        return {"message": "User not found"}

    event = db.query(Event).filter(Event.event_id == event_id).first()

    if event is None:
        return {"message": "Event not found"}

    registered_count = db.query(Attendee).filter(Attendee.event_id == event_id).count()

    if registered_count >= event.capacity:
        return {"message": "Event is full"}

    existing_registration = db.query(Attendee).filter(Attendee.user_id == registration.user_id, Attendee.event_id == event_id).first()

    if existing_registration is not None:
        return {"message": "Already registered"}

    new_registration = Attendee(
        user_id = registration.user_id,
        event_id  = event_id
    )

    db.add(new_registration)
    db.commit()
    db.refresh(new_registration)

    return new_registration


@app.post("/communities")
def create_community(community: CommunityCreate, db: Session = Depends(get_db)):
    creator = db.query(User).filter(User.user_id == community.creator_id).first()

    if creator is None:
        return {"message": "Creator not found"}

    new_community = Community(
        name         = community.name,
        description  = community.description,
        creator_id   = community.creator_id
    )

    db.add(new_community)
    db.commit()
    db.refresh(new_community)

    return new_community


@app.post("/communities/{community_id}/join")
def join_community(community_id: int, membership: CommunityJoin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == membership.user_id).first()

    if user is None:
        return {"message": "User not found"}

    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        return {"message": "Community not found"}

    existing_membership = db.query(CommunityMember).filter(CommunityMember.user_id == membership.user_id , CommunityMember.community_id == community_id).first()

    if existing_membership is not None:
        return {"message": "Already a member"}


    new_membership = CommunityMember(
        user_id       = membership.user_id,
        community_id  = community_id
    )

    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)

    return new_membership
    

@app.get("/communities/{community_id}/members")
def get_community_members(community_id: int, db:Session = Depends(get_db)):
    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        return {"message": "Community not found"}

    members = db.query(CommunityMember).filter(CommunityMember.community_id == community_id).all()

    return members



@app.post("/communities/{community_id}/discussions")
def create_descussion(community_id: int, discussion: DiscussionCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == discussion.user_id).first()

    if user is None:
        return {"message" : "user not found"}

    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        return {"message" : "community not found"}

    existing_membership = db.query(CommunityMember).filter(CommunityMember.user_id == discussion.user_id, CommunityMember.community_id == community_id).first()

    if existing_membership is None:
        return {"message" : "User is not a member of this community"}

    new_content = Discussion(
        user_id       = discussion.user_id,
        community_id  = community_id,
        content       = discussion.content
    )

    db.add(new_content)
    db.commit()
    db.refresh(new_content)

    return new_content

    

@app.get("/communities/{community_id}/discussions")
def get_discussions(community_id: int, db: Session = Depends(get_db)):
    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        return {"message" : "community not found"}

    discussions = db.query(Discussion).filter(Discussion.community_id == community_id).all()

    if not discussions:
        return {"message" : "There is no discussions"}

    return discussions
    


@app.get("/discussions/{post_id}")
def get_discussion(post_id: int, db: Session = Depends(get_db)):
    discussion = db.query(Discussion).filter(Discussion.post_id == post_id).first()

    if discussion is None:
        return {"message" : "discussion not found"}
    
    return discussion



@app.put("/discussions/{post_id}")
def update_discussion(post_id: int, discussion_update:DiscussionUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == discussion_update.user_id).first()

    if user is None:
        return {"message" : "User not found"}
    
    discussion = db.query(Discussion).filter(Discussion.post_id == post_id).first()

    if discussion is None:
        return {"message" : "Discussion not found"}

    if discussion.user_id != discussion_update.user_id:
        return {"message" : "You can't update this discussion"}

    discussion.content = discussion_update.content
    
    db.commit()
    db.refresh(discussion)

    return discussion




@app.delete("/discussions/{post_id}/")
def delete_discussion(post_id: int, discussion_delete: DiscussionDelete, db: Session = Depends(get_db)):
    discussion = db.query(Discussion).filter(Discussion.post_id == post_id).first()

    if discussion is None:
        return {"message" : "Discussion not found"}

    if discussion.user_id != discussion_delete.user_id:
        return {"message" : "You cannot delete this discussion"}
    
    db.delete(discussion)
    db.commit()

    return {"message" : "Discussion deleted successfully"}




@app.delete("/communities/{community_id}/leave")
def leave_community(community_id: int, membership: CommunityJoin, db: Session = Depends(get_db)):
    existing_membership = db.query(CommunityMember).filter(CommunityMember.user_id == membership.user_id, CommunityMember.community_id == community_id).first()

    if existing_membership is None:
        return {"message": "User isn't member can't leave"}

    db.delete(existing_membership)
    db.commit()

    return {"message": "User left the community successfully"}




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

    return {"massage": "Event deleted successfully"}

