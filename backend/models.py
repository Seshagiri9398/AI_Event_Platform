from sqlalchemy import Column, Integer, String, DateTime
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

