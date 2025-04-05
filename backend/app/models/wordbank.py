from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class CustomWord(Base):
    __tablename__ = "custom_words"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    word = Column(String)
    meaning = Column(String)
    usage_example = Column(String)

    user = relationship("User", back_populates="wordbank")
