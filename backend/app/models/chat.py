from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Boolean 
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class UserRole(str, enum.Enum): 
    student = "student"
    parent = "parent"
    teacher = "teacher"

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_pinned = Column(Boolean, default=False)

    user = relationship("User", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete")
    files = relationship("ChatFile", back_populates="chat", cascade="all, delete")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    chat_id = Column(Integer, ForeignKey("chats.id"))
    role = Column(String)
    message = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="messages")
    chat = relationship("Chat", back_populates="messages")



class ChatFile(Base):
    __tablename__ = "chat_files"

    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    filename = Column(String)
    mimetype = Column(String)
    size = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    filepath = Column(String, nullable=True)

    chat = relationship("Chat", back_populates="files")

