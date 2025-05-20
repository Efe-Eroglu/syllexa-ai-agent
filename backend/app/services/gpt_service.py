import openai
from app.core.config import settings
import logging
from openai import OpenAI  # Yeni import şekli
from .rag_service import RAGService
from sqlalchemy.orm import Session

# İstemciyi oluştur
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Loglama ayarları
logging.basicConfig(level=logging.DEBUG)

def get_assistant_response(message: str, chat_id: int = None, db: Session = None) -> str:
    """
    Kullanıcıdan alınan mesajı özel eğitilmiş asistanınıza gönderir ve yanıtı döndürür.
    
    Args:
        message: Kullanıcı mesajı
        chat_id: Sohbet ID'si (RAG için)
        db: Veritabanı oturumu
    
    Returns:
        str: Asistan yanıtı
    """
    assistant_id = settings.ASSISTANT_ID
    logging.debug(f"Asistan ID'si: {assistant_id}")
    
    try:
        # RAG servisi ile geliştirilmiş prompt oluştur (eğer chat_id varsa)
        enhanced_message = message
        context_sources = []
        
        if chat_id is not None:
            try:
                # RAG servisini başlat
                rag_service = RAGService(db=db)
                
                # Geliştirilmiş prompt oluştur
                enhanced_message = rag_service.enhance_prompt_with_context(message, chat_id)
                
                # Kaynak bilgilerini topla
                context_items = rag_service.retrieve_relevant_context(message, chat_id)
                if context_items:
                    for item in context_items:
                        source = item["metadata"].get("source", "Bilinmeyen kaynak")
                        if source not in context_sources:
                            context_sources.append(source)
                
                logging.debug(f"RAG ile zenginleştirilmiş prompt: {enhanced_message[:100]}...")
            except Exception as rag_error:
                logging.error(f"RAG işlemi sırasında hata: {str(rag_error)}")
                # RAG hatası durumunda orijinal mesajı kullan
                enhanced_message = message
        
        # Yeni bir thread oluştur
        thread = client.beta.threads.create()
        logging.debug(f"Thread oluşturuldu: {thread.id}")

        # Thread'e geliştirilmiş kullanıcı mesajını ekle
        client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=enhanced_message
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
                response = msg.content[0].text.value
                
                # Eğer doküman kaynakları kullanıldıysa, yanıta kaynak bilgisi ekle
                if context_sources:
                    source_info = "\n\n*Kullanılan kaynaklar: " + ", ".join(context_sources) + "*"
                    response += source_info
                
                return response
        
        return "Yanıt alınamadı"

    except Exception as e:
        logging.error(f"OpenAI API hatası: {str(e)}")
        raise Exception(f"OpenAI API hatası: {str(e)}")