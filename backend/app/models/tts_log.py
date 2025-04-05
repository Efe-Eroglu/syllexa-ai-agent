from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class TTSLog(Base):
    __tablename__ = "tts_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    text = Column(Text)
    audio_url = Column(String)
    played_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="tts_logs")
