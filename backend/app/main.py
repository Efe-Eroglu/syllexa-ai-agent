from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware  
import os
from app.db.database import Base, engine, get_db
from app.models import user, chat, task, progress, tts_log, wordbank
from app.api import auth_routes, auth_google

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Syllexa AI Backend")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY")  
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(auth_google.router, prefix="/auth", tags=["Social Login"])
