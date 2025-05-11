from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.services.gpt_service import get_assistant_response
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
import logging

# Hata loglamayı başlatıyoruz
logging.basicConfig(level=logging.DEBUG)


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


# 🎯 [4] Mesaj gönder ve GPT yanıtını ekle
@router.post("/chats/send", response_model=ChatMessageOut)
def send_message(
    message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)  # Kimlik doğrulama
):
    # Kullanıcının mesajını veritabanına kaydet
    try:
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
        logging.debug(f"New message saved: {new_msg}")
    except Exception as e:
        logging.error(f"Error while saving message: {str(e)}")
        raise HTTPException(status_code=500, detail="Message saving failed")

    # Mesajı asistan ID'sine gönder
    try:
        assistant_response = get_assistant_response(message.message)  # Asistanla etkileşim
        logging.debug(f"Assistant response: {assistant_response}")
    except Exception as e:
        logging.error(f"Error while getting assistant response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Asistan yanıtı alınırken hata oluştu: {str(e)}")

    # Asistan yanıtını veritabanına kaydet
    try:
        gpt_msg = ChatMessage(
            chat_id=message.chat_id,
            user_id=current_user.id,
            role="assistant",  # GPT rolü
            message=assistant_response,
            timestamp=datetime.utcnow()
        )
        db.add(gpt_msg)
        db.commit()
        db.refresh(gpt_msg)
        logging.debug(f"Assistant response saved: {gpt_msg}")
    except Exception as e:
        logging.error(f"Error while saving assistant response: {str(e)}")
        raise HTTPException(status_code=500, detail="Assistant response saving failed")

    return gpt_msg

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
    files = db.query(ChatFile).filter(ChatFile.chat_id == chat_id).all()

    if not files:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    for file in files:
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


# ✏️ [9] Sohbet ismini değiştir
@router.put("/chats/{chat_id}/rename", response_model=ChatOut)
def rename_chat(
    chat_id: int,
    chat_data: ChatCreate,  
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()

    if not chat:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    chat.title = chat_data.title  
    db.commit()
    db.refresh(chat)
    return chat


# [10] Sohbet istatistiklerini getir
@router.get("/chats/{chat_id}/stats")
def get_chat_stats(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()

    if not chat:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    # İstatistikler
    total_messages = db.query(ChatMessage).filter(ChatMessage.chat_id == chat_id).count()
    total_files = db.query(ChatFile).filter(ChatFile.chat_id == chat_id).count()

    return {
        "total_messages": total_messages,
        "total_files": total_files,
    }


# [11] Sohbet Geçmişi
@router.get("/chats/{chat_id}/history", response_model=List[ChatMessageOut])
def get_chat_history(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()

    if not chat:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    messages = db.query(ChatMessage).filter(ChatMessage.chat_id == chat_id).all()
    return messages

# [12] Sohbet Sabitleme
@router.post("/chats/{chat_id}/pin")
def pin_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()

    if not chat:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    chat.is_pinned = True  
    db.commit()
    db.refresh(chat)
    return chat


# [13] Sabitlenmiş Sohbetleri Getir
@router.get("/chats/pinned", response_model=List[ChatOut])
def get_pinned_chats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    pinned_chats = db.query(Chat).filter(Chat.user_id == current_user.id, Chat.is_pinned == True).all()

    if not pinned_chats:
        raise HTTPException(status_code=404, detail="Sabitlenmiş sohbet bulunamadı")

    return pinned_chats
