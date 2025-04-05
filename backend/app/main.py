from fastapi import FastAPI
from app.db.database import Base, engine, get_db
from app.models import user, chat, task, progress, tts_log, wordbank
from sqlalchemy.orm import Session
from fastapi import Depends

app = FastAPI(title="Syllexa AI Backend - DB Test")

Base.metadata.create_all(bind=engine)

@app.get("/db-check")
def check_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "message": "Veritabanı bağlantısı başarılı, tablolar oluşturuldu."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
