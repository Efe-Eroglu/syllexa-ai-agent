from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine
from app.models import user, chat, task, progress, tts_log, wordbank

from fastapi.staticfiles import StaticFiles
from app.api import auth_routes, auth_google
from app.api.websocket_speech import router as websocket_speech_router
from app.api.chat_routes import router as chat_router

app = FastAPI(title="Syllexa AI Backend")

app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:5174",  # Alternatif port
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
app.include_router(websocket_speech_router, tags=["WebSocket"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])

@app.on_event("startup")
def startup_event():
    # Sadece eksik tabloları oluştur, var olanları korur
    Base.metadata.create_all(bind=engine)
