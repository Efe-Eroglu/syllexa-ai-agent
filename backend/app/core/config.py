from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Google OAuth
    GOOGLE_CLIENT_ID: str 
    GOOGLE_CLIENT_SECRET: str

    # Facebook OAuth (ileride kullanılacak)
    FACEBOOK_APP_ID: str = Field(..., env="FACEBOOK_APP_ID")
    FACEBOOK_APP_SECRET: str = Field(..., env="FACEBOOK_APP_SECRET")

    class Config:
        env_file = ".env"

settings = Settings()
