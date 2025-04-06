from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# ========== Chat ==========

class ChatCreate(BaseModel):
    title: str

class ChatOut(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


# ========== ChatMessage ==========

class ChatMessageCreate(BaseModel):
    chat_id: int
    message: str
    role: str = "student"

class ChatMessageOut(BaseModel):
    id: int
    chat_id: int
    user_id: int
    role: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ========== ChatFile ==========

class ChatFileOut(BaseModel):
    id: int
    chat_id: int
    filename: str
    mimetype: str
    size: int
    uploaded_at: datetime
    filepath: str 

    class Config:
        from_attributes = True
