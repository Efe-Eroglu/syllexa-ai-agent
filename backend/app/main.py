from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.db.database import Base, engine, get_db
from app.models import user, chat, task, progress, tts_log, wordbank
from app.api import auth_routes

app = FastAPI(title="Syllexa AI Backend")

Base.metadata.create_all(bind=engine)

print(">>> ROUTER:", auth_routes.router.routes)
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])

@app.get("/db-check")
def check_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "message": "Veritabanı bağlantısı başarılı, tablolar oluşturuldu."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
