from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.stt_service import transcribe_audio_bytes
import logging

router = APIRouter()

@router.websocket("/ws/speech")
async def websocket_speech(websocket: WebSocket):
    await websocket.accept()
    logging.info("🔌 WebSocket bağlantısı alındı.")

    try:
        while True:
            data = await websocket.receive_bytes()
            logging.info(f"📥 Ses verisi alındı: {len(data)} byte")

            try:
                text = transcribe_audio_bytes(data)
                logging.info(f"📝 Transkript: {text}")
                await websocket.send_text(text or "[Boş çıktı]")
            except Exception as e:
                logging.error(f"STT hatası: {str(e)}")
                await websocket.send_text("[STT işlemi sırasında hata oluştu]")

    except WebSocketDisconnect:
        logging.info("❌ WebSocket bağlantısı kapandı.")