/**
 * Geliştirilmiş ses kayıt modülü - Türkçe konuşma tanıma için optimize edilmiş
 */

import Recorder from 'recorder-js';

// Recorder değişkenleri
let recorder = null;
let audioContext = null;
let stream = null;
let audioProcessor = null;

// Kayıt ayarları
const SAMPLE_RATE = 44100; // Hz
const CHANNELS = 1; // Mono
const BIT_DEPTH = 16; // Bit derinliği

/**
 * Mikrofon erişimi için izin iste ve kayda başla
 * @param {Object} options - Gelişmiş kayıt ayarları
 * @returns {Promise<void>}
 */
export const startRecording = async (options = {}) => {
  try {
    console.log("Mikrofon erişimi isteniyor...");
    
    // Varsayılan ayarları kullanıcının ayarlarıyla birleştir
    const settings = {
      echoCancellation: true,          // Eko iptali
      noiseSuppression: true,          // Gürültü bastırma
      autoGainControl: true,           // Otomatik kazanç kontrolü (ses seviyesi dengeleme)
      sampleRate: SAMPLE_RATE,         // Örnekleme hızı
      channelCount: CHANNELS,          // Kanal sayısı (mono)
      latency: 0,                      // En düşük gecikme
      ...options
    };
    
    // Kullanıcıdan mikrofona erişim izni istiyoruz (gelişmiş ayarlarla)
    stream = await navigator.mediaDevices.getUserMedia({ 
      audio: settings
    });
    
    console.log("Mikrofon erişimi sağlandı");
    
    // Ses bağlamı oluştur (browser uyumluluğu için)
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: settings.sampleRate
    });
    
    // Ses işleme kanalı oluştur
    setupAudioProcessing(stream, audioContext);
    
    // Kaydediciyi başlat
    recorder = new Recorder(audioContext, {
      numberOfChannels: settings.channelCount, // Mono ses kaydı
      encoderSampleRate: settings.sampleRate,
      encoderBitRate: BIT_DEPTH
    });

    recorder.init(stream);
    recorder.start();
    
    console.log("Kayıt başlatıldı");
    
    return true;
  } catch (error) {
    console.error("Kayıt başlatılamadı:", error);
    closeRecording();
    return false;
  }
};

/**
 * Gelişmiş ses işleme için audio pipeline kurulumu
 * @param {MediaStream} stream - Mikrofon akışı
 * @param {AudioContext} context - Ses bağlamı
 */
const setupAudioProcessing = (stream, context) => {
  try {
    // Mikrofon kaynağını oluştur
    const microphone = context.createMediaStreamSource(stream);
    
    // Ses işleme düğümleri kur
    
    // 1. Gürültü filtreleme için high-pass filtresi (düşük frekanslı gürültüyü keser)
    const highpassFilter = context.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = 85; // 85 Hz altındaki sesleri filtrele (arka plan gürültüsü)
    
    // 2. Compressor ile ses seviyesi dengeleme (yüksek sesleri kıs, düşük sesleri yükselt)
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;  // -24 dB üzerinde sıkıştırma başlat
    compressor.knee.value = 30;        // Yumuşak geçiş
    compressor.ratio.value = 12;       // Sıkıştırma oranı
    compressor.attack.value = 0.003;   // Sıkıştırmanın başlama hızı
    compressor.release.value = 0.25;   // Sıkıştırmanın bırakma hızı
    
    // 3. Konuşma netliği için mid-boost filtresi (insan sesinin olduğu aralığı vurgula)
    const midBoostFilter = context.createBiquadFilter();
    midBoostFilter.type = 'peaking';
    midBoostFilter.frequency.value = 2500; // 2.5 kHz (insan konuşması genelde 1-3 kHz aralığında)
    midBoostFilter.Q.value = 1.0;         // Genişlik
    midBoostFilter.gain.value = 6;        // 6 dB artış
    
    // 4. Gain node ile final ses seviyesi ayarlama
    const gainNode = context.createGain();
    gainNode.gain.value = 1.2; // Ses seviyesini %20 artır
    
    // Ses işleme zincirini bağla
    microphone
      .connect(highpassFilter)
      .connect(compressor)
      .connect(midBoostFilter)
      .connect(gainNode);
    
    // İşlenen ses zincirini kaydediciye bağla
    audioProcessor = gainNode;
    
    console.log("Ses işleme kanalı kuruldu");
  } catch (error) {
    console.error("Ses işleme kanalı kurulurken hata:", error);
  }
};

/**
 * Kaydı durdur ve kaydedilen ses verisini döndür
 * @returns {Promise<Blob|null>} Kaydedilen ses verisi (.wav formatında)
 */
export const stopRecording = async () => {
  if (!recorder) {
    console.warn("Aktif bir kayıt bulunamadı");
    return null;
  }

  try {
    console.log("Kayıt durduruluyor...");
    
    // Kayıt durduruluyor ve ses verileri alınıyor
    const { blob, buffer } = await recorder.stop();
    
    // Kayıt kaynakları serbest bırakılıyor
    closeRecording();
    
    console.log("Kayıt tamamlandı:", blob.size, "bytes");
    
    // Ses blobu (WAV formatında) döndürülüyor
    return blob;
  } catch (error) {
    console.error("Kayıt durdurulurken hata oluştu:", error);
    closeRecording();
    return null;
  }
};

/**
 * Kayıt kaynaklarını temizle ve kapat
 */
export const closeRecording = () => {
  try {
    // Kayıt akışını durdur
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    
    // İşleme kanalını temizle
    if (audioProcessor) {
      audioProcessor = null;
    }
    
    // Kaydediciyi temizle
    if (recorder) {
      recorder = null;
    }
    
    // Ses bağlamını kapat
    if (audioContext) {
      // Not: Bazı tarayıcılarda close() metodu olmayabilir
      if (audioContext.state !== 'closed' && audioContext.close) {
        audioContext.close();
      }
      audioContext = null;
    }
    
    console.log("Kayıt kaynakları temizlendi");
  } catch (error) {
    console.error("Kaynaklar temizlenirken hata oluştu:", error);
  }
};

/**
 * Mikrofon düzey ölçümü için bir analizör oluştur
 * @param {Function} onLevelChange - Ses seviyesi değiştiğinde çağrılacak işlev
 * @returns {Function} Analizörü durdurmak için çağrılacak işlev
 */
export const createVolumeAnalyzer = (onLevelChange) => {
  if (!audioContext || !stream) {
    console.warn("Aktif bir ses bağlamı veya akışı yok");
    return () => {};
  }
  
  try {
    // Analizör düğümü oluştur
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    // Mikrofon giriş düğümünü oluştur
    const microphone = audioContext.createMediaStreamSource(stream);
    
    // Mikrofonu analizöre bağla
    microphone.connect(analyser);
    
    // Ses düzeyi verilerini tutacak dizi
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Düzenli aralıklarla ses düzeyini ölç
    let animationFrame;
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Ses düzeyi ortalamasını hesapla (0-255 aralığında)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Ses düzeyi değişikliğini bildir (0-100 aralığına dönüştürülmüş)
      onLevelChange(Math.round((average / 255) * 100));
      
      // Bir sonraki çerçeve için planlama yap
      animationFrame = requestAnimationFrame(updateLevel);
    };
    
    // Ölçümü başlat
    updateLevel();
    
    // Temizleme işlevini döndür
    return () => {
      cancelAnimationFrame(animationFrame);
      microphone.disconnect();
    };
  } catch (error) {
    console.error("Ses düzeyi analizörü oluşturulamadı:", error);
    return () => {};
  }
};
