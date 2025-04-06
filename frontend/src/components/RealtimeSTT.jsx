import React, { useEffect, useRef, useState } from 'react';
import { WS_BASE_URL } from '../config';

const RealtimeSTT = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);

  const startRecording = async () => {
    setTranscript('');
    setIsRecording(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // WebSocket bağlantısını kur
    wsRef.current = new WebSocket(`${WS_BASE_URL}/speech`);

    wsRef.current.onmessage = (event) => {
      setTranscript((prev) => prev + event.data);
    };

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(event.data);
      }
    };

    mediaRecorder.start(1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return (
    <div>
      <h2>🎙️ Canlı Konuşma Tanıma</h2>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Duraklat' : 'Başla'}
      </button>
      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
        <strong>Transkript:</strong>
        <p>{transcript || 'Henüz bir şey söylenmedi...'}</p>
      </div>
    </div>
  );
};

export default RealtimeSTT;
