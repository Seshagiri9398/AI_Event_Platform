from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime, timezone 


from backend.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    name    = Column(String, nullable=False)
    email   = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role     = Column(String, nullable=False ,default="USER")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class Event(Base):
    __tablename__ = "events"

    event_id     = Column(Integer, primary_key=True)
    title        = Column(String, nullable=False)
    description  = Column(String, nullable=False)
    date         = Column(DateTime(timezone=True),nullable=False, default=lambda: datetime.now(timezone.utc))
    location     = Column(String, nullable=False)
    capacity     = Column(Integer,nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    status       = Column(String, nullable=False, default="PENDING")



class Attendee(Base):
    __tablename__ = "attendees"

    attendee_id   = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    event_id      = Column(Integer, ForeignKey("events.event_id"), nullable=False)
    registered_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


    __table_args__ = (UniqueConstraint("user_id","event_id", name="uq_user_event"),)


class Community(Base):
    __tablename__ = "communities"

    community_id = Column(Integer, primary_key=True)
    name         = Column(String, nullable=False)
    description  = Column(String, nullable=False)
    creator_id   = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at   = Column(DateTime(timezone=True), nullable=False, default= lambda: datetime.now(timezone.utc))



class CommunityMember(Base):
    __tablename__ = "community_members"

    member_id     = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.user_id"),nullable=False)
    community_id  = Column(Integer, ForeignKey("communities.community_id"),nullable=False)
    joined_at     = Column(DateTime(timezone=True), nullable=False, default= lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint("user_id","community_id", name = "uq_user_community"),)