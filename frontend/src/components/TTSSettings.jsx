import React, { useState, useEffect } from 'react';
import { FiSave, FiInfo, FiSliders, FiVolume2 } from 'react-icons/fi';
import { notifySuccess, notifyError } from '../utils/toast';

const TTSSettings = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isAutoTtsEnabled, setIsAutoTtsEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [stability, setStability] = useState(0.65);
  const [clarity, setClarity] = useState(0.7);

  useEffect(() => {
    // Load saved settings
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    const savedTtsEnabled = localStorage.getItem('tts_enabled');
    const savedAutoTtsEnabled = localStorage.getItem('auto_tts_enabled');
    const savedSpeechRate = localStorage.getItem('speech_rate');
    const savedStability = localStorage.getItem('tts_stability');
    const savedClarity = localStorage.getItem('tts_clarity');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    if (savedTtsEnabled !== null) {
      setIsTtsEnabled(savedTtsEnabled === 'true');
    }
    
    if (savedAutoTtsEnabled !== null) {
      setIsAutoTtsEnabled(savedAutoTtsEnabled === 'true');
    } else {
      // Varsayılan olarak otomatik seslendirme açık
      localStorage.setItem('auto_tts_enabled', 'true');
    }
    
    if (savedSpeechRate !== null) {
      setSpeechRate(parseFloat(savedSpeechRate));
    }
    
    if (savedStability !== null) {
      setStability(parseFloat(savedStability));
    }
    
    if (savedClarity !== null) {
      setClarity(parseFloat(savedClarity));
    }
  }, []);

  const saveSettings = () => {
    try {
      localStorage.setItem('elevenlabs_api_key', apiKey);
      localStorage.setItem('tts_enabled', isTtsEnabled.toString());
      localStorage.setItem('auto_tts_enabled', isAutoTtsEnabled.toString());
      localStorage.setItem('speech_rate', speechRate.toString());
      localStorage.setItem('tts_stability', stability.toString());
      localStorage.setItem('tts_clarity', clarity.toString());
      
      notifySuccess('Ses ayarları kaydedildi');
      if (onClose) onClose();
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      notifyError('Ayarlar kaydedilemedi');
    }
  };

  return (
    <div className="tts-settings">
      <h3>Türkçe Ses Sentezi Ayarları</h3>
      
      <div className="setting-group">
        <label htmlFor="tts-toggle">Sesli Yanıtlar</label>
        <div className="toggle-switch">
          <input 
            type="checkbox" 
            id="tts-toggle" 
            checked={isTtsEnabled}
            onChange={(e) => setIsTtsEnabled(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="auto-tts-toggle">
          <div className="feature-label">
            <FiVolume2 className="feature-icon" />
            <span>Otomatik Seslendirme</span>
          </div>
          <small>Mesajlar geldiğinde otomatik seslendir</small>
        </label>
        <div className="toggle-switch">
          <input 
            type="checkbox" 
            id="auto-tts-toggle" 
            checked={isAutoTtsEnabled}
            onChange={(e) => setIsAutoTtsEnabled(e.target.checked)}
            disabled={!isTtsEnabled}
          />
          <span className={`toggle-slider ${!isTtsEnabled ? 'disabled' : ''}`}></span>
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="api-key">ElevenLabs API Anahtarı</label>
        <div className="input-with-info">
          <input
            type="password"
            id="api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="ElevenLabs API anahtarınızı girin"
          />
          <a 
            href="https://elevenlabs.io/speech-synthesis" 
            target="_blank" 
            rel="noopener noreferrer"
            className="info-link"
          >
            <FiInfo />
          </a>
        </div>
        <small>API anahtarınızı almak için ElevenLabs hesabınızı ziyaret edin</small>
      </div>
      
      <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
        <FiSliders />
        <span>Gelişmiş Türkçe Ayarları</span>
        <span className="toggle-indicator">{showAdvanced ? '▼' : '▶'}</span>
      </div>
      
      {showAdvanced && (
        <div className="advanced-settings">
          <div className="setting-group">
            <label htmlFor="speech-rate">
              Konuşma Hızı: {speechRate.toFixed(1)}
            </label>
            <input
              type="range"
              id="speech-rate"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>Yavaş</span>
              <span>Normal</span>
              <span>Hızlı</span>
            </div>
          </div>
          
          <div className="setting-group">
            <label htmlFor="stability">
              Kararlılık: {stability.toFixed(2)}
            </label>
            <input
              type="range"
              id="stability"
              min="0"
              max="1"
              step="0.05"
              value={stability}
              onChange={(e) => setStability(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>Yaratıcı</span>
              <span>Dengeli</span>
              <span>Kararlı</span>
            </div>
          </div>
          
          <div className="setting-group">
            <label htmlFor="clarity">
              Netlik: {clarity.toFixed(2)}
            </label>
            <input
              type="range"
              id="clarity"
              min="0"
              max="1"
              step="0.05"
              value={clarity}
              onChange={(e) => setClarity(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>Doğal</span>
              <span>Dengeli</span>
              <span>Net</span>
            </div>
          </div>
        </div>
      )}
      
      <button className="save-button" onClick={saveSettings}>
        <FiSave />
        Kaydet
      </button>
    </div>
  );
};

export default TTSSettings; 