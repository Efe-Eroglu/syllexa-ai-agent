/**
 * Text-to-Speech module using ElevenLabs API - Türkçe için optimize edilmiş
 */

// Türkçe konuşma için önerilen varsayılan ElevenLabs sesi
const DEFAULT_VOICE_ID = 'UKn8d228qbbMa2f9ezXL'; // Kullanıcının belirttiği artist sesi
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Convert text to speech using ElevenLabs API with Turkish optimization
 * @param {string} text - The text to convert to speech
 * @returns {Promise<ArrayBuffer>} - Promise that resolves to audio data
 */
export const textToSpeech = async (text, apiKey) => {
  if (!text || !apiKey) {
    throw new Error('Text and API key are required for TTS conversion');
  }

  // Kullanıcı ayarlarını al
  const stabilityValue = parseFloat(localStorage.getItem('tts_stability') || '0.65');
  const clarityValue = parseFloat(localStorage.getItem('tts_clarity') || '0.7');
  
  // Kullanıcının seçtiği ses ID'sini al, yoksa varsayılanı kullan
  const voiceId = localStorage.getItem('elevenlabs_voice_id') || DEFAULT_VOICE_ID;
  
  // Metindeki _ karakterlerini anlamlı bir ifadeyle değiştir
  const cleanedText = text.replace(/_+/g, '  ');

  // Türkçe test edilen ayarlar
  // Eğer metin soru içeriyorsa net ama doğal bir konuşma tonu kullan
  const isQuestion = cleanedText.includes('?');
  const style = isQuestion ? 0.35 : 0.4;

  try {
    console.log('ElevenLabs API isteği gönderiliyor...', voiceId);
    console.log('Temizlenmiş metin:', cleanedText);
    
    // Türkçe dili için optimize edilmiş API isteği
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept-Language': 'tr-TR'
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: 'eleven_multilingual_v2', // Çok dilli model seçimi
          voice_settings: {
            stability: stabilityValue,    // Kullanıcı ayarından alınır
            similarity_boost: clarityValue, // Kullanıcı ayarından alınır
            style: style,                  // Metin tipine göre ayarlanır
            use_speaker_boost: true        // Daha doğal ses için
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API Hatası:', response.status, errorData);
      throw new Error(`ElevenLabs API error: Status ${response.status} - ${JSON.stringify(errorData)}`);
    }

    console.log('ElevenLabs API yanıtı alındı, ses verisi işleniyor...');
    return await response.arrayBuffer();
  } catch (error) {
    console.error('TTS error:', error);
    throw error;
  }
};

/**
 * Play audio from an ArrayBuffer
 * @param {ArrayBuffer} audioData - The audio data to play
 */
export const playAudio = (audioData) => {
  const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  // Türkçe ses için playback ayarları
  const speechRate = parseFloat(localStorage.getItem('speech_rate') || '1.0');
  audio.playbackRate = speechRate; // Kullanıcı ayarından alınır
  audio.preservesPitch = true;     // Tonu koru
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
  
  audio.play().catch(error => {
    console.error('Audio playback error:', error);
  });
}; 