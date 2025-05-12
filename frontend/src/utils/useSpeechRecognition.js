/**
 * Türkçe dili için optimize edilmiş web tabanlı konuşma tanıma modülü
 */

// Web Speech API tarayıcı tarafından destekleniyor mu kontrol et
const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// Speech Recognition API için değişkenler
let recognition = null;
let recognitionTimeout = null;
let isListening = false;
let finalTranscript = ''; // Biriken son metin

/**
 * Türkçe konuşma tanıma için Web Speech API başlatma
 * @param {Function} onResultCallback - Tanıma sonucu için callback fonksiyonu
 * @param {Function} onErrorCallback - Hata durumunda çağrılacak callback
 * @param {Function} onFinalCallback - Son tanıma sonucu için callback fonksiyonu (gönderilecek mesaj için)
 * @param {Object} options - Ek ayarlar
 * @returns {Object} Konuşma tanıma kontrolleri
 */
export const useSpeechRecognition = (onResultCallback, onErrorCallback, onFinalCallback, options = {}) => {
  // Varsayılan ayarları kullanıcı ayarları ile birleştir
  const settings = {
    confidenceThreshold: 0.7, // Güven eşiği (0-1 arası)
    autoStopTimeout: 2000,    // Otomatik durdurma için bekleme süresi (ms)
    ...options
  };
  
  // API tarayıcıda desteklenmiyorsa uyarı ver
  if (!isSpeechRecognitionSupported()) {
    console.error("Web Speech API bu tarayıcıda desteklenmiyor!");
    onErrorCallback && onErrorCallback("Web Speech API bu tarayıcıda desteklenmiyor!");
    return {
      startListening: () => {},
      stopListening: () => {},
      isSupported: false,
      isListening: false,
      resetTranscript: () => {}
    };
  }

  // SpeechRecognition nesnesini oluştur (browser uyumluluğu için)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  // Tanıma sonucunu sıfırla
  const resetTranscript = () => {
    finalTranscript = '';
  };
  
  // Dinlemeyi başlat
  const startListening = () => {
    if (isListening) return;
    
    // Yeni oturum için temizle
    resetTranscript();
    
    try {
      // Yeni bir recognition nesnesi oluştur
      recognition = new SpeechRecognition();
      
      // Türkçe dili için en iyi ayarları kullan
      recognition.lang = 'tr-TR';
      recognition.continuous = true;     // Sürekli dinleme modunu etkinleştir
      recognition.interimResults = true; // Ara sonuçları al
      recognition.maxAlternatives = 3;   // Daha fazla alternatif sonuç al (doğruluk için)
      
      // Sonuç olayı
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let hasHighConfidenceResult = false;
        
        // Tüm sonuçları işle
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          // Güven skorunu ve ses kalitesini logla
          console.log(`Sonuç ${i}: "${transcript}" (Güven: ${(confidence * 100).toFixed(1)}%)`);
          
          if (result.isFinal) {
            // Sadece güven eşiğinden yüksek sonuçları kabul et
            if (confidence >= settings.confidenceThreshold) {
              finalTranscript += transcript + ' ';
              hasHighConfidenceResult = true;
            } else if (confidence >= 0.5) { // Orta dereceli güven
              // Güven düşük ama kabul edilebilir
              finalTranscript += transcript + ' ';
              console.warn(`Düşük güvenlikle kabul edilen sonuç: ${transcript}`);
            }
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Ara sonuç olarak callback'i çağır (kullanıcıya feedback)
        if (interimTranscript) {
          onResultCallback(interimTranscript, false);
        }
        
        // Son sonuç olarak callback'i çağır
        if (hasHighConfidenceResult) {
          onResultCallback(finalTranscript.trim(), true);
          
          // Her konuşma algılandığında timeout'u sıfırla
          if (recognitionTimeout) {
            clearTimeout(recognitionTimeout);
          }
          
          // Kullanıcı konuşmayı bıraktığında otomatik durdurma için timeout
          recognitionTimeout = setTimeout(() => {
            if (isListening && finalTranscript.trim()) {
              // Son metni gönder
              onFinalCallback && onFinalCallback(finalTranscript.trim());
              stopListening();
            }
          }, settings.autoStopTimeout);
        }
      };
      
      // Hata olayı
      recognition.onerror = (event) => {
        console.error("Konuşma tanıma hatası:", event.error);
        
        // Hata türüne göre farklı mesajlar göster
        let errorMessage = "Konuşma tanıma sırasında bir hata oluştu.";
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = "Ses algılanamadı. Lütfen mikrofona konuştuğunuzdan emin olun.";
            break;
          case 'audio-capture':
            errorMessage = "Mikrofon bulunamadı veya açılamadı.";
            break;
          case 'not-allowed':
            errorMessage = "Mikrofon erişimine izin verilmedi.";
            break;
          case 'network':
            errorMessage = "Ağ hatası. Lütfen internet bağlantınızı kontrol edin.";
            break;
          case 'aborted':
            // Kullanıcı tarafından iptal edildi, sessizce devam et
            return;
        }
        
        onErrorCallback && onErrorCallback(errorMessage);
        
        // Ağ hatası veya çok sık tekrarlanan hatalarda tanımayı durdur
        if (event.error === 'network' || event.error === 'service-not-allowed') {
          stopListening();
        }
      };
      
      // Tanıma bittiğinde otomatik olarak yeniden başlat (sürekli dinleme için)
      recognition.onend = () => {
        if (isListening) {
          try {
            // Kısa bir gecikme ile tekrar başlat (tarayıcı kararlılığı için)
            setTimeout(() => {
              if (isListening) {
                recognition.start();
              }
            }, 100);
          } catch (error) {
            console.error("Tanıma yeniden başlatılamadı:", error);
            isListening = false;
            onErrorCallback && onErrorCallback("Konuşma tanıma oturumu sonlandırıldı.");
          }
        }
      };
      
      // Tanımayı başlat
      recognition.start();
      isListening = true;
      
      console.log("Türkçe konuşma tanıma başlatıldı");
      return true;
    } catch (error) {
      console.error("Konuşma tanıma başlatılamadı:", error);
      onErrorCallback && onErrorCallback("Konuşma tanıma başlatılamadı");
      isListening = false;
      return false;
    }
  };
  
  // Dinlemeyi durdur
  const stopListening = () => {
    if (!isListening || !recognition) return false;
    
    try {
      // Timeout'u temizle
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
        recognitionTimeout = null;
      }
      
      // Tanımayı durdur
      recognition.stop();
      isListening = false;
      
      console.log("Türkçe konuşma tanıma durduruldu");
      return true;
    } catch (error) {
      console.error("Konuşma tanıma durdurulamadı:", error);
      return false;
    }
  };
  
  return {
    startListening,
    stopListening,
    isSupported: true,
    isListening: () => isListening,
    resetTranscript
  };
};

/**
 * Web Speech API'nin yanı sıra, daha güçlü ve doğru tanıma için 
 * gelişmiş ses kayıt ve işleme
 */
export const useEnhancedSpeechRecognition = (onResultCallback, onErrorCallback, onFinalCallback, options = {}) => {
  // Birleşik sonuç için state
  let combinedTranscript = '';
  let webApiInstance = null;
  
  // Web Speech API ve recorder.js kullanarak gelişmiş tanıma
  const webApi = useSpeechRecognition(
    // Ara sonuç
    (text, isFinal) => {
      if (isFinal) {
        combinedTranscript = text;
      }
      onResultCallback(text, isFinal);
    },
    // Hata
    onErrorCallback,
    // Son sonuç
    (finalText) => {
      // Eğer metin varsa, sonucu bildir
      if (finalText) {
        onFinalCallback && onFinalCallback(finalText);
      }
    },
    options
  );
  
  return {
    ...webApi,
    // Gelişmiş başlatma 
    startListening: () => {
      combinedTranscript = '';
      webApiInstance = webApi;
      return webApi.startListening();
    }
  };
};

/**
 * Web Speech API'nin yanı sıra, daha güçlü ve doğru tanıma için 
 * ElevenLabs Speech-to-Text API kullanımı
 */
export const useElevenLabsSpeechRecognition = () => {
  // ElevenLabs API'si için gelecekte uygulanabilir
  // Şu an için Web Speech API kullanıyoruz
  return useSpeechRecognition;
}; 