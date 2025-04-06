from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse

from app.db.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.services.auth import register_user, authenticate_user
from app.utils.jwt import create_access_token, verify_token
from app.models.user import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# -------------------- CURRENT USER --------------------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Geçerli token'dan kullanıcıyı çözümler.
    """
    token_data = verify_token(token)
    if not token_data or not token_data.email:
        raise HTTPException(status_code=401, detail="Geçersiz token")

    user = db.query(User).filter(User.email == token_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    return user

# -------------------- REGISTER --------------------
@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Yeni kullanıcı oluşturur.
    """
    try:
        new_user = register_user(db, user_data)
        return new_user
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

# -------------------- LOGIN --------------------
@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Kullanıcıyı doğrular ve JWT token üretir.
    """
    user = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre",
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# -------------------- LOGOUT --------------------
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Kullanıcı çıkış yapar. Şu an JWT stateless olduğu için token istemciden silinmeli.
    İleride refresh token desteklenirse burada blackliste alınabilir.
    """
    return JSONResponse(
        status_code=200,
        content={"message": f"Kullanıcı {current_user.email} başarıyla çıkış yaptı."}
    )

# -------------------- ME --------------------
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    JWT token ile giriş yapmış olan kullanıcının bilgilerini döner.
    """
    return current_user

# -------------------- PING --------------------
@router.get("/ping")
def ping():
    return {"msg": "auth router aktif"}
