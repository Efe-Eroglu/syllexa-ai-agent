import Recorder from 'recorder-js';

let recorder = null;

export const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  recorder = new Recorder(audioContext);

  recorder.init(stream);
  recorder.start();
};

export const stopRecording = async () => {
  if (!recorder) return null;

  const { blob } = await recorder.stop();
  return blob; // Bu bir .wav blobudur
};
