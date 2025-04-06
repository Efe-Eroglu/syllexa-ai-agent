from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.chat import Chat, ChatMessage, ChatFile
from app.schemas.chat import (
    ChatCreate,
    ChatOut,
    ChatMessageCreate,
    ChatMessageOut,
    ChatFileOut,
)
import os
from app.api.auth_routes import get_current_user

router = APIRouter()
UPLOAD_DIRECTORY = "./uploads"

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)
    
    
# 🎯 [1] Yeni sohbet oluştur
@router.post("/chats/create", response_model=ChatOut)
def create_chat(
    chat: ChatCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_chat = Chat(title=chat.title, user_id=current_user.id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat


# 📃 [2] Kullanıcının sohbet listesi
@router.get("/chats/list", response_model=List[ChatOut])
def list_user_chats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Chat).filter(Chat.user_id == current_user.id).all()


# 🗑️ [3] Sohbet sil (ve ilişkili mesajlar + dosyalar)
@router.delete("/chats/{chat_id}")
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()

    if not chat:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    db.delete(chat)
    db.commit()
    return {"message": f"Sohbet (ID={chat_id}) başarıyla silindi."}


# 💬 [4] Mesaj gönder
@router.post("/chats/send", response_model=ChatMessageOut)
def send_message(
    message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_msg = ChatMessage(
        chat_id=message.chat_id,
        user_id=current_user.id,
        role=message.role,
        message=message.message,
        timestamp=datetime.utcnow()
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg


# 📨 [5] Belirli sohbetin mesajlarını getir
@router.get("/chats/{chat_id}/messages", response_model=List[ChatMessageOut])
def get_chat_messages(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(ChatMessage).filter(ChatMessage.chat_id == chat_id).all()


# 📤 [6] Dosya yükle (chat'e ait)
@router.post("/chats/{chat_id}/upload", response_model=ChatFileOut)
async def upload_file(
    chat_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    filepath = None  
    if file:
        filepath = os.path.join(UPLOAD_DIRECTORY, file.filename)
        with open(filepath, "wb") as f:
            f.write(await file.read())

    new_file = ChatFile(
        chat_id=chat_id,
        filename=file.filename,
        filepath=filepath, 
        mimetype=file.content_type,
        size=len(file.filename),
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return new_file


# 📦 [7] Sohbete ait dosyaları getir
@router.get("/chat_files/{chat_id}", response_model=List[ChatFileOut])
def get_chat_files(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # chat_id'ye ait dosyaları sorguluyoruz
    files = db.query(ChatFile).filter(ChatFile.chat_id == chat_id).all()

    if not files:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    # Dosyaların yolu doğru şekilde döndürülüyor
    for file in files:
        # `filepath`'i http yolu ile güncelliyoruz
        file.filepath = f"/uploads/{file.filename}"

    return files


# ❌ [8] Dosya sil
@router.delete("/chat_files/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    file = db.query(ChatFile).filter(ChatFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    db.delete(file)
    db.commit()
    return {"message": f"Dosya (ID={file_id}) silindi."}
