from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from elevenlabs import ElevenLabs
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import traceback
import os
from dotenv import load_dotenv
from io import BytesIO
from openai import OpenAI  # Translate ve STT için OpenAI kullanacağız (Whisper + GPT)
from tempfile import NamedTemporaryFile
import re


load_dotenv()  # .env dosyasını yükler

app = FastAPI()
client = ElevenLabs(api_key=os.getenv("API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OpenAI_API_KEY"))


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
# @app.post("/speech-to-speech")
# async def speech_to_speech(file: UploadFile = File(...), voice_id: str = "EXAVITQu4vr4xnSDxMaL"):
#     # Yüklenen ses dosyasını oku
#     audio_data = await file.read()

#     # ElevenLabs API'yi çağır (generator döner)
#     audio_generator = client.speech_to_speech.convert(
#         audio=audio_data,
#         voice_id=voice_id,
#         model_id="eleven_english_sts_v2"
#     )

#     # Generator'dan gelen tüm chunk'ları birleştir
#     audio_bytes = b"".join(audio_generator)

#     # MP3 olarak kaydet
#     output_path = "converted_voice.mp3"
#     with open(output_path, "wb") as f:
#         f.write(audio_bytes)

#     # Dosyayı istemciye geri gönder
#     return FileResponse(output_path, media_type="audio/mpeg", filename="converted_voice.mp3")



@app.post("/speech-to-speech")
async def speech_to_speech(
    file: UploadFile = File(...),
    voice_id: str = Form("EXAVITQu4vr4xnSDxMaL"),
    mode: str = Form("clone"),          # "clone" veya "dub"
    source_lang: str = Form("en"),      # kaynak dil
    target_lang: str = Form("en"),      # hedef dil (dub için)
):
    try:
        # --- Dublaj yapılabilecek diller ---
        allowed_dub_languages = ["en", "tr", "fr"]

        # --- Dublaj modu ve dil kontrolü ---
        if mode == "dub" and target_lang not in allowed_dub_languages:
            return JSONResponse(
                {"error": f"Dub mode only supports these languages: {', '.join(allowed_dub_languages)}"},
                status_code=400
            )

        audio_bytes = await file.read()

        # 🎧 1️⃣ Ses Klonlama (aynı dilde)
        if mode == "clone":
            tts_model = "eleven_english_sts_v2"  # İngilizce clone modeli
            audio_generator = client.speech_to_speech.convert(
                audio=audio_bytes,
                voice_id=voice_id,
                model_id=tts_model
            )
            output_path = "converted_voice.mp3"
            with open(output_path, "wb") as f:
                f.write(b"".join(audio_generator))
            return FileResponse(output_path, media_type="audio/mpeg", filename="converted_voice.mp3")

        # 🌍 2️⃣ Dublaj (Speech → Text → Translate → Speech)
        elif mode == "dub":
            # --- A. Geçici dosyaya kaydet ---
            with NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name

            # --- B. Whisper ile Speech-to-Text ---
            print("🗣️ Converting speech to text...")
            with open(temp_audio_path, "rb") as audio_file:
                transcription = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            original_text = transcription.text
            print(f"✅ Transcribed Text ({source_lang}): {original_text}")

            # --- C. GPT-4 ile Translate ---
            print("🌐 Translating text...")
            translation_prompt = f"Translate this text from {source_lang} to {target_lang}: {original_text}"
            translation_response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": translation_prompt}],
            )
            translated_text_raw = translation_response.choices[0].message.content.strip()
            print(f"✅ Raw Translated Text ({target_lang}): {translated_text_raw}")

            # --- 🔹 Tırnak içindeki ifadeyi çek ---
            match = re.search(r'["“”](.*?)["“”]', translated_text_raw)
            if match:
                translated_text = match.group(1)
            else:
                translated_text = translated_text_raw
            print(f"✅ Final Translated Text ({target_lang}): {translated_text}")

            # --- D. Dub için voice_id eşlemesi ---
            dub_voice_map = {
                "en": "EXAVITQu4vr4xnSDxMaL",  # İngilizce dub sesi
                # "tr": "TR_VOICE_ID",           # Türkçe dub sesi
                # "fr": "FR_VOICE_ID",           # Fransızca dub sesi
            }
            selected_voice_id = dub_voice_map[target_lang]

            # --- E. ElevenLabs ile Text-to-Speech ---
            print("🎙️ Converting translated text to speech...")
            tts_audio = client.text_to_speech.convert(
                text=translated_text,
                voice_id=selected_voice_id,
                model_id="eleven_multilingual_v2"
            )

            # --- F. Çıkış dosyasını oluştur ---
            output_path = f"dubbed_{target_lang}.mp3"
            with open(output_path, "wb") as f:
                f.write(b"".join(tts_audio))

            # --- G. Temizlik ---
            os.remove(temp_audio_path)

            return FileResponse(output_path, media_type="audio/mpeg", filename=os.path.basename(output_path))

        else:
            return JSONResponse({"error": "Invalid mode. Use 'clone' or 'dub'."}, status_code=400)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)


# -------------------
# AVAILABLE VOICES
# -------------------
@app.get("/voices")
async def list_voices():
    voices = client.voices.get_all()
    return [{"name": v.name, "voice_id": v.voice_id} for v in voices.voices]
