import openai
from app.core.config import settings
import logging
from openai import OpenAI  # Yeni import şekli

# İstemciyi oluştur
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Loglama ayarları
logging.basicConfig(level=logging.DEBUG)

def get_assistant_response(message: str) -> str:
    """
    Kullanıcıdan alınan mesajı özel eğitilmiş asistanınıza gönderir ve yanıtı döndürür.
    """
    assistant_id = settings.ASSISTANT_ID
    logging.debug(f"Asistan ID'si: {assistant_id}")

    try:
        # Yeni bir thread oluştur
        thread = client.beta.threads.create()
        logging.debug(f"Thread oluşturuldu: {thread.id}")

        # Thread'e kullanıcı mesajını ekle
        client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=message
        )
        
        # Asistanı çalıştır
        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant_id
        )
        logging.debug(f"Run başlatıldı: {run.id} - Durum: {run.status}")

        # Run'ın tamamlanmasını bekle
        while run.status != "completed":
            run = client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )
            logging.debug(f"Run durumu: {run.status}")

        # Mesajları al
        messages = client.beta.threads.messages.list(thread_id=thread.id)
        
        # Asistanın son mesajını bul (en üstteki ilk asistan mesajı)
        for msg in messages.data:
            if msg.role == "assistant":
                return msg.content[0].text.value
        
        return "Yanıt alınamadı"

    except Exception as e:
        logging.error(f"OpenAI API hatası: {str(e)}")
        raise Exception(f"OpenAI API hatası: {str(e)}")