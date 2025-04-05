from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.hash import hash_password, verify_password
from typing import Optional
import logging

logger = logging.getLogger("auth_service")


def register_user(db: Session, user_data: UserCreate) -> User:
    # Kullanıcının email adresi veritabanında zaten var mı diye kontrol et
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise ValueError("Bu e-posta zaten kayıtlı.")

    # Şifreyi hashle
    hashed_pw = hash_password(user_data.password)

    # Yeni kullanıcı nesnesi oluştur
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_pw
    )

    # Veritabanına kaydet
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"Yeni kullanıcı kaydedildi: {new_user.email}")
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    # E-posta ile kullanıcıyı bul
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    # Şifre doğru mu kontrol et
    if not verify_password(password, user.hashed_password):
        return None

    logger.info(f"Giriş başarılı: {user.email}")
    return user
