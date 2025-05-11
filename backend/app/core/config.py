# backend/app/core/config.py

from pydantic_settings import BaseSettings   # pydantic-settings kullanıyoruz

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Google OAuth
    GOOGLE_CLIENT_ID: str 
    GOOGLE_CLIENT_SECRET: str

    # Facebook OAuth (ileride kullanılacak)
    FACEBOOK_APP_ID: str 
    FACEBOOK_APP_SECRET: str

    # OpenAI API
    OPENAI_API_KEY: str 
    ASSISTANT_ID: str
    
    class Config:
        env_file = ".env"

# Ayarları yükle
settings = Settings()
