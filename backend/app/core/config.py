# backend/app/core/config.py

from typing import Optional
from pydantic_settings import BaseSettings   # pydantic-settings kullanıyoruz

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # Frontend URL (OAuth yönlendirmeleri için)
    FRONTEND_URL: str = "http://localhost:5173"

    # Google OAuth
    GOOGLE_CLIENT_ID: str 
    GOOGLE_CLIENT_SECRET: str

    # Facebook OAuth (ileride kullanılacak)
    FACEBOOK_APP_ID: str 
    FACEBOOK_APP_SECRET: str

    # OpenAI API
    OPENAI_API_KEY: str 
    ASSISTANT_ID: str
    
    # ElevenLabs API
    ELEVENLABS_API_KEY: Optional[str] = None
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }

# Ayarları yükle
settings = Settings()
