from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from elevenlabs import ElevenLabs

from fastapi.middleware.cors import CORSMiddleware

import os
from dotenv import load_dotenv

load_dotenv()  # .env dosyasını yükler

app = FastAPI()
client = ElevenLabs(api_key=os.getenv("API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # veya ["http://localhost:8081"] gibi özel adres
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------
# TEXT-TO-SPEECH
# -------------------
@app.post("/text-to-speech")
async def text_to_speech(text: str, voice_id: str = "EXAVITQu4vr4xnSDxMaL"):
    # Generator döndüğü için bütün chunkları birleştir
    audio_generator = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2"
    )

    # Tüm chunkları birleştir
    audio_bytes = b"".join(audio_generator)

    # Dosyayı yaz
    output_path = "output.mp3"
    with open(output_path, "wb") as f:
        f.write(audio_bytes)

    return FileResponse(output_path, media_type="audio/mpeg", filename="output.mp3")

# -------------------
# SPEECH-TO-TEXT
# -------------------
@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    transcript = client.speech_to_text.convert(file=file.file, model_id="scribe_v1")
    return {"text": transcript.text}

# -------------------
# SPEECH-TO-SPEECH
# -------------------
@app.post("/speech-to-speech")
async def speech_to_speech(file: UploadFile = File(...), voice_id: str = "EXAVITQu4vr4xnSDxMaL"):
    # Yüklenen ses dosyasını oku
    audio_data = await file.read()

    # ElevenLabs API'yi çağır (generator döner)
    audio_generator = client.speech_to_speech.convert(
        audio=audio_data,
        voice_id=voice_id,
        model_id="eleven_english_sts_v2"
    )

    # Generator'dan gelen tüm chunk'ları birleştir
    audio_bytes = b"".join(audio_generator)

    # MP3 olarak kaydet
    output_path = "converted_voice.mp3"
    with open(output_path, "wb") as f:
        f.write(audio_bytes)

    # Dosyayı istemciye geri gönder
    return FileResponse(output_path, media_type="audio/mpeg", filename="converted_voice.mp3")


# -------------------
# AVAILABLE VOICES
# -------------------
@app.get("/voices")
async def list_voices():
    voices = client.voices.get_all()
    return [{"name": v.name, "voice_id": v.voice_id} for v in voices.voices]
