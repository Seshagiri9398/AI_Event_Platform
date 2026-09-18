from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
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
