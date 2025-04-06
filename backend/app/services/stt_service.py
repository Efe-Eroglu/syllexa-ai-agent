from faster_whisper import WhisperModel
import uuid
import tempfile
import os

model = WhisperModel("base", compute_type="int8", device="cpu")

def transcribe_audio_bytes(audio_bytes: bytes) -> str:
    temp_dir = tempfile.gettempdir()
    file_id = str(uuid.uuid4())
    input_path = os.path.join(temp_dir, f"{file_id}.wav")

    with open(input_path, "wb") as f:
        f.write(audio_bytes)

    segments, _ = model.transcribe(input_path, language="tr")
    full_text = " ".join([segment.text.strip() for segment in segments])

    os.remove(input_path)

    return full_text.strip()
