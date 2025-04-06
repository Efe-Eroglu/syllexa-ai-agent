from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class UserRole(str, enum.Enum):
    student = "student"
    parent = "parent"
    teacher = "teacher"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_social = Column(Boolean, default=False)
    role = Column(Enum(UserRole), default=UserRole.student)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ilişkiler
    messages = relationship("ChatMessage", back_populates="user", cascade="all, delete")
    chats = relationship("Chat", back_populates="user", cascade="all, delete")  # Bu satırı ekleyin
    tasks = relationship("Task", back_populates="user", cascade="all, delete")
    progress = relationship("LearningProgress", back_populates="user", cascade="all, delete")
    tts_logs = relationship("TTSLog", back_populates="user", cascade="all, delete")
    wordbank = relationship("CustomWord", back_populates="user", cascade="all, delete")

