import openai
from app.core.config import settings
import logging

openai.api_key = settings.OPENAI_API_KEY

# Loglama ayarları
logging.basicConfig(level=logging.DEBUG)  # DEBUG seviyesinde loglama yapacağız

def get_assistant_response(message: str) -> str:
    """
    Kullanıcıdan alınan mesajı belirli bir asistan ID'sine gönderir ve yanıtı döndürür.
    """
    assistant_id = settings.ASSISTANT_ID  # Asistan ID'sini alıyoruz
    logging.debug(f"Asistan ID'si: {assistant_id}")  # Asistan ID'sini logluyoruz

    try:
        # OpenAI API'sine mesajı gönderiyoruz
        logging.debug(f"Asistana gönderilen mesaj: {message}")  # Mesajı logluyoruz

        response = openai.ChatCompletion.create(  # Yeni API arayüzü
            model="gpt-3.5-turbo",  # Modelin adı güncel olmalı
            messages=[
                {"role": "user", "content": message},  # Kullanıcının mesajını göndermek
            ],
            user=assistant_id  # Asistan ID'sini belirtmek
        )

        # Yanıtı logluyoruz
        logging.debug(f"Alınan yanıt: {response}")  
        
        # Asistanın yanıtını döndürüyoruz
        return response['choices'][0]['message']['content'].strip()

    except Exception as e:
        logging.error(f"OpenAI API hatası: {str(e)}")  # Hata mesajını logluyoruz
        raise Exception(f"OpenAI API hatası: {str(e)}")
