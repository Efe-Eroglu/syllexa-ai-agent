from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    GOOGLE_CLIENT_ID: str
    FACEBOOK_APP_ID: str
    FACEBOOK_APP_SECRET: str

    class Config:
        env_file = ".env"

settings = Settings()
