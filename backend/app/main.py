from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine, get_db
from app.models import user, chat, task, progress, tts_log, wordbank
from app.api import auth_routes, auth_google

app = FastAPI(title="Syllexa AI Backend")

origins = [
    "http://localhost:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,             
    allow_credentials=True,
    allow_methods=["*"],               
    allow_headers=["*"],               
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(auth_google.router, prefix="/auth", tags=["Social Login"])

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
