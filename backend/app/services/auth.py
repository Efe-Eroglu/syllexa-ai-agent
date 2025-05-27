from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.hash import hash_password, verify_password
from typing import Optional
import logging
from datetime import datetime
import uuid
from app.utils.security import get_password_hash

logger = logging.getLogger("auth_service")


def register_user(db: Session, user_data: UserCreate) -> User:
    """
    Yeni kullanıcı kaydı yapar.
    """
    # E-posta zaten kullanılıyor mu?
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise ValueError(f"'{user_data.email}' e-posta adresi zaten kullanılıyor.")

    # Yeni kullanıcı oluştur
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Kullanıcı kimlik doğrulaması yapar.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_or_create_user_from_google(db: Session, email: str, name: str, google_id: str) -> User:
    """
    Google ile giriş yapan kullanıcıyı veritabanında bulur veya oluşturur.
    """
    # E-posta ile kullanıcıyı ara
    user = db.query(User).filter(User.email == email).first()
    
    # Kullanıcı varsa güncelle ve döndür
    if user:
        # Google ID'sini güncelle (eğer daha önce kayıt edilmediyse)
        if not user.google_id:
            user.google_id = google_id
            db.commit()
            db.refresh(user)
        return user
    
    # Kullanıcı yoksa yeni kullanıcı oluştur
    # Rastgele şifre oluştur (kullanıcı normal girişte kullanamaz)
    random_password = str(uuid.uuid4())
    hashed_password = get_password_hash(random_password)
    
    new_user = User(
        email=email,
        full_name=name,
        hashed_password=hashed_password,
        google_id=google_id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
