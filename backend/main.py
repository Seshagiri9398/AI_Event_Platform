from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime, timedelta


from backend.models import User, Event, Attendee, Community, CommunityMember, Discussion, Notification, Review
from backend.database import engine, Base, get_db
from backend.utils.password import hash_password, verify_password
from backend.utils.jwt import create_access_token
from backend.utils.auth import get_current_user, get_current_admin
from backend.config import ADMIN_BOOTSTRAP_SECRET

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)



#pydantics
class UserCreate(BaseModel):
    name     : str = Field(min_length=2, max_length=100)
    email    : EmailStr
    password : str = Field(min_length=8)

class PasswordChange(BaseModel):
    current_password : str
    new_password     : str = Field(min_length=8)


class EventCreate(BaseModel):
    title         : str
    description   : str
    date          : datetime 
    location      : str
    capacity      : int   


class CommunityCreate(BaseModel):
    name         : str
    description  : str

class DiscussionCreate(BaseModel):
    content : str

class DiscussionUpdate(BaseModel):
    content : str


class AdminBootstrapRequest(BaseModel):
    name     : str
    email    : str
    password : str

class LoginRequest(BaseModel):
    email    : EmailStr
    password : str = Field(min_length=8)


class UserResponse(BaseModel):
    user_id    : int
    name       : str
    email      : str
    role       : str
    created_at : datetime

class EventResponse(BaseModel):
    event_id     : int
    title        : str
    description  : str
    date         : datetime
    location     : str
    capacity     : int
    organizer_id : int
    status       : str

    model_config = {"from_attributes":True}

class EventWithCapacity(EventResponse):
    registered_count : int
    available_seats  : int

class AttendeeResponse(BaseModel):
    attendee_id  : int
    user_id      : int
    event_id     : int

    registered_at : datetime

    model_config = {"from_attributes": True}

class CommunityResponse(BaseModel):
    community_id  : int
    name          : str
    description   : str
    creator_id    : int
    created_at    : datetime

    model_config = {"from_attributes": True}


class CommunityMemberResponse(BaseModel):
    member_id    : int
    user_id      : int
    community_id : int
    joined_at    : datetime

    model_config = {"from_attributes" : True}


class DiscussionResponse(BaseModel):
    post_id      : int
    user_id      : int
    community_id : int
    content      : str
    created_at   : datetime

    model_config = {"from_attributes" : True}

class ReviewCreate(BaseModel):
    rating   : int = Field(ge=1, le=5)
    comment  : str | None = None


class ReviewResponse(BaseModel):
    review_id   : int
    user_id     : int
    event_id    : int
    rating      : int
    comment     : str | None
    created_at  : datetime

    model_config = {"from_attributes": True}


@app.post("/admin/bootstrap", response_model=UserResponse)
def bootstrap_admin(admin: AdminBootstrapRequest, x_admin_bootstrap_secret: str = Header(...), db: Session = Depends(get_db)):
    if x_admin_bootstrap_secret != ADMIN_BOOTSTRAP_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin bootstrap secret")

    existing_admin = db.query(User).filter(User.role == "ADMIN").first()

    if existing_admin is not None:
        raise HTTPException(status_code=403, detail="Admin already exists")

    hashed_password = hash_password(admin.password)
    new_admin = User(
        name     = admin.name,
        email    = admin.email,
        password = hashed_password,
        role     = "ADMIN"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin


@app.post("/users/change-password")
def password_change(password : PasswordChange, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    is_password_correct = verify_password(password.current_password, current_user.password)

    if not is_password_correct:
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.password = hash_password(password.new_password)
    
    db.commit()

    return {"message" : "Password updated successfully"}


@app.get("/users")
def get_users(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    return db.query(User).all()



@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    new_user = User(
        name     = user.name, 
        email    = user.email, 
        password = hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user



@app.post("/login")
def user_login(login:LoginRequest,db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login.email).first()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    is_password_correct =verify_password(login.password,user.password)

    if not is_password_correct:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "user_id" : user.user_id,
        "role"    : user.role
    }

    access_token = create_access_token(token_data)

    return {
        "access_token" : access_token,
        "token_type"   : "bearer"
    }




@app.post("/events",status_code=201, response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_event = Event(
        title        = event.title,
        description  = event.description,
        date         = event.date,
        location     = event.location,
        capacity     = event.capacity,
        organizer_id = current_user.user_id,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event



@app.get("/events", response_model=list[EventWithCapacity])
def get_events(db: Session = Depends(get_db)):

    events = db.query(Event).order_by(Event.event_id.desc()).all()
    
    result = []

    for event in events:
        registered_count = (db.query(Attendee).filter(Attendee.event_id == event.event_id).count())

        result.append({
            "event_id"      : event.event_id,
            "title"         : event.title,
            "description"   : event.description,
            "date"          : event.date,
            "location"      : event.location,
            "capacity"      : event.capacity,
            "organizer_id"  : event.organizer_id,
            "status"        : event.status,
            "registered_count" : registered_count,
            "available_seats" : max(event.capacity - registered_count, 0),
        })

    return result


@app.get("/events/search", response_model= list[EventResponse])
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



@app.post("/events/{event_id}/register",status_code=201, response_model= AttendeeResponse)
def register_event(event_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    event = db.query(Event).filter(Event.event_id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    registered_count = db.query(Attendee).filter(Attendee.event_id == event_id).count()

    if registered_count >= event.capacity:
        raise HTTPException(status_code=409, detail="Event is full")

    existing_registration = db.query(Attendee).filter(Attendee.user_id == current_user.user_id, Attendee.event_id == event_id).first()

    if existing_registration is not None:
        raise HTTPException(status_code=409, detail="Already registered for this event")

    new_registration = Attendee(
        user_id = current_user.user_id,
        event_id  = event_id
    )

   

    try:
        notification = Notification(user_id = current_user.user_id, message = f"You have successfully registered for the event: {event.title}")

        db.add(new_registration)
        db.add(notification)

        db.commit()
        db.refresh(new_registration)
    except Exception:
        db.rollback()
        raise
    
    return new_registration



@app.post("/events/{event_id}/reviews", response_model=ReviewResponse, status_code=201)
def create_review(event_id: int, review_data: ReviewCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    event = db.query(Event).filter(Event.event_id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    registration = db.query(Attendee).filter(
        Attendee.user_id == current_user.user_id,
        Attendee.event_id == event_id
    ).first()

    if registration is None:
        raise HTTPException(status_code=403, detail="You must register for this event before reviewing it")

    existing_review = db.query(Review).filter(
        Review.user_id == current_user.user_id,
        Review.event_id == event_id
    ).first()

    if existing_review:
        raise HTTPException(status_code=409, detail="You have already reviewed this event")

    new_review = Review(
        user_id=current_user.user_id,
        event_id=event_id,
        rating=review_data.rating,
        comment=review_data.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


@app.get("/events/{event_id}/reviews", response_model=list[ReviewResponse])
def get_event_reviews(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.event_id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    reviews = db.query(Review).filter(Review.event_id == event_id).order_by(Review.created_at.desc()).all()

    return reviews



@app.delete("/events/{event_id}/register", status_code=200)
def cancel_event_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Check whether the event exists
    event = db.query(Event).filter(
        Event.event_id == event_id
    ).first()

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    # Find this user's registration for this event
    registration = db.query(Attendee).filter(
        Attendee.user_id == current_user.user_id,
        Attendee.event_id == event_id
    ).first()

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="You are not registered for this event"
        )

    try:
        db.delete(registration)

        notification = Notification(
            user_id=current_user.user_id,
            message=f"You have cancelled your registration for the event: {event.title}"
        )

        db.add(notification)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Registration cancelled successfully",
        "event_id": event_id
    }



@app.get("/my-registrations")
def get_my_registrations(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    registrations = (db.query(Attendee, Event)
                     .join(Event, Attendee.event_id == Event.event_id)
                     .filter(Attendee.user_id == current_user.user_id)
                     .all())

    return [
        {
            "event_id" : event.event_id,
            "title"    : event.title,
            "date"     : event.date,
            "location" : event.location,
            "status"   : event.status,
        }
        for registration, event in registrations
    ]



@app.post("/communities", status_code=201)
def create_community(community: CommunityCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
   
        
    new_community = Community(
        name         = community.name,
        description  = community.description,
        creator_id   = current_user.user_id,
    )

    db.add(new_community)
    db.commit()
    db.refresh(new_community)

    return new_community


@app.get("/communities", response_model= list[CommunityResponse])
def get_communities(db: Session = Depends(get_db)):
    return db.query(Community).all()



@app.get("/communities/{community_id}", response_model=CommunityResponse)
def get_community(community_id : int, db: Session = Depends(get_db)):
    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    return community



@app.post("/communities/{community_id}/join")
def join_community(community_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")

    existing_membership = db.query(CommunityMember).filter(CommunityMember.user_id == current_user.user_id , CommunityMember.community_id == community_id).first()

    if existing_membership is not None:
        raise HTTPException(status_code=409,detail="Already a member")


    new_membership = CommunityMember(
        user_id       = current_user.user_id,
        community_id  = community_id
    )



    try:
        notification = Notification(user_id = current_user.user_id, message = f"You have successfully joined the community: {community.name}")

        db.add(new_membership)
        db.add(notification)

        db.commit()
        db.refresh(new_membership)
    except Exception:
        db.rollback()
        raise

    return new_membership
    


@app.get("/communities/{community_id}/members", response_model= list[CommunityMemberResponse])
def get_community_members(community_id: int, db:Session = Depends(get_db),current_user = Depends(get_current_user)):
    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")

    members = db.query(CommunityMember).filter(CommunityMember.community_id == community_id).all()

    return members



@app.post("/communities/{community_id}/discussions",response_model= DiscussionResponse, status_code=201)
def create_discussion(community_id: int, discussion: DiscussionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        raise HTTPException(status_code=404, detail="community not found")

    existing_membership = db.query(CommunityMember).filter(CommunityMember.user_id == current_user.user_id, CommunityMember.community_id == community_id).first()

    if existing_membership is None:
        raise HTTPException(status_code=403, detail="User is not a member of this community")

    new_content = Discussion(
        user_id       = current_user.user_id,
        community_id  = community_id,
        content       = discussion.content
    )

    db.add(new_content)
    db.commit()
    db.refresh(new_content)

    return new_content

    

@app.get("/communities/{community_id}/discussions",response_model=list[DiscussionResponse])
def get_discussions(community_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    community = db.query(Community).filter(Community.community_id == community_id).first()

    if community is None:
        raise HTTPException(status_code=404, detail="community not found")

    discussions = db.query(Discussion).filter(Discussion.community_id == community_id).all()

    return discussions    



@app.get("/discussions/{post_id}",response_model=DiscussionResponse)
def get_discussion(post_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.post_id == post_id).first()

    if discussion is None:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    return discussion



@app.put("/discussions/{post_id}", response_model= DiscussionResponse)
def update_discussion(post_id: int, discussion_update:DiscussionUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    
    discussion = db.query(Discussion).filter(Discussion.post_id == post_id).first()

    if discussion is None:
        raise HTTPException(status_code=404, detail="Discussion not found")

    if discussion.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this discussion")

    discussion.content = discussion_update.content
    
    db.commit()
    db.refresh(discussion)

    return discussion



@app.delete("/discussions/{post_id}/", status_code=204)
def delete_discussion(post_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.post_id == post_id).first()

    if discussion is None:
        raise HTTPException(status_code=404, detail="Discussion not found")

    if discussion.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this discussion")
    
    db.delete(discussion)
    db.commit()



@app.delete("/communities/{community_id}/leave")
def leave_community(community_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    existing_membership = db.query(CommunityMember).filter(CommunityMember.user_id == current_user.user_id, CommunityMember.community_id == community_id).first()

    if existing_membership is None:
        raise HTTPException(status_code=404, detail="User is not a member of this community")

    db.delete(existing_membership)
    db.commit()

    return {"message": "User left the community successfully"}



@app.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id:int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.event_id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.put("/events/{event_id}", response_model= EventResponse)
def update_event(event_id: int, event: EventCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    existing_event = (db.query(Event).filter(Event.event_id == event_id).first())

    if existing_event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if existing_event.organizer_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this event")
    
    existing_event.title        = event.title
    existing_event.description  = event.description
    existing_event.date         = event.date
    existing_event.location     = event.location
    existing_event.capacity     = event.capacity

    db.commit()
    db.refresh(existing_event)

    return existing_event



@app.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    event = (db.query(Event).filter(Event.event_id == event_id).first())

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this event")

    db.delete(event)
    db.commit()


@app.post("/notifications")
def create_notification(user_id: int, message: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = Notification(
        user_id = user_id,
        message = message
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification

@app.get("/notifications")
def get_notification(skip: int = 0, limit: int = 10, unread_only: bool = False, db: Session = Depends(get_db), current_user : User = Depends(get_current_user)):

    query = db.query(Notification).filter(Notification.user_id == current_user.user_id)

    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    notifications = (query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all())

    return notifications



@app.get("/notifications/unread-count")
def get_unread_notification_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    unread_count = (db.query(Notification).filter(Notification.user_id == current_user.user_id, Notification.is_read.is_(False)).count())

    return {"unread_count" : unread_count}


@app.patch("/notifications/{notification_id}/read")
def mark_notification_as_read(notification_id : int, db: Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    find_notification = db.query(Notification).filter(Notification.notification_id == notification_id, Notification.user_id == current_user.user_id).first()

    if find_notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    find_notification.is_read = True

    db.commit()
    return find_notification


@app.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(Notification.notification_id == notification_id, Notification.user_id == current_user.user_id).first()

    if notification is None:
        raise HTTPException(status_code=404, detail=("Notification not found"))

    db.delete(notification)
    db.commit()

    return {"message" : "Notification deleted successfully"}