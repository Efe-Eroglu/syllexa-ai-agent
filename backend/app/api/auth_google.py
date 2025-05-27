from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from app.db.database import get_db
from app.models.user import User
from app.utils.jwt import create_access_token
from app.services.auth import get_or_create_user_from_google
from app.core.config import settings
import os
import httpx

router = APIRouter()

oauth = OAuth()

oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    access_token_url='https://oauth2.googleapis.com/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    client_kwargs={
        'scope': 'openid email profile'
    },
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
)

@router.get("/login/google")
async def google_login(request: Request):
    # Backend callback URL (kullanıcı Google'da giriş yaptıktan sonra geri döneceği URL)
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        # Token alınıyor
        token = await oauth.google.authorize_access_token(request)
        
        # Google userinfo endpoint'inden kullanıcı bilgilerini alalım
        access_token = token.get('access_token')
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            user_info = resp.json()
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Google'dan kullanıcı bilgisi alınamadı")

        # Kullanıcı bilgilerini al
        email = user_info.get('email')
        name = user_info.get('name')
        google_id = user_info.get('sub')  # Google's unique ID for the user

        if not email:
            raise HTTPException(status_code=400, detail="E-posta bilgisi alınamadı")

        # get_or_create_user_from_google fonksiyonunu kullan
        user = get_or_create_user_from_google(db, email, name, google_id)
        
        # JWT token oluştur
        access_token = create_access_token(data={"sub": user.email})
        
        # Frontend'e yönlendir
        frontend_redirect = f"{settings.FRONTEND_URL}/login?token={access_token}"
        return RedirectResponse(url=frontend_redirect)
    
    except Exception as e:
        # Hata durumunda detayları logla
        print(f"Google callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Google login işlemi sırasında hata oluştu: {str(e)}")
