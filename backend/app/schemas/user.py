from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    student = "student"
    parent = "parent" 
    teacher = "teacher"

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.student

class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    is_social: bool = False
    created_at: Optional[datetime] = None
    google_id: Optional[str] = None
    facebook_id: Optional[str] = None
    github_id: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class GoogleAuth(BaseModel):
    code: str
