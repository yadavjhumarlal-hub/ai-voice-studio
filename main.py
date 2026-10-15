import os
import asyncio
import tempfile
import base64
from pathlib import Path

import requests
import edge_tts

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


# ==================================================
# AI VOICE STUDIO PRO V3.2
# Azure Speech + Edge TTS
# ==================================================

app = FastAPI(title="AI Voice Studio PRO V3")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

if STATIC_DIR.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(STATIC_DIR)),
        name="static"
    )


# -------------------------------
# Azure Voices
# -------------------------------

AZURE_VOICES = {
    "arjun": {
        "name": "hi-IN-MadhurNeural",
        "label": "Madhur — Male"
    },
    "swara": {
        "name": "hi-IN-SwaraNeural",
        "label": "Swara — Female"
    }
}


# -------------------------------
# Edge Voices
# -------------------------------

EDGE_VOICES = {}
EDGE_VOICE_LIST = []


# -------------------------------
# Request Model
# -------------------------------

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=12000)
    engine: str = "edge"
    voice: str = "arjun"
    style: str = "neutral"
    preset: str = "custom"

    rate: int = 0
    pitch: int = 0
    volume: int = 0

    auto_director: bool = True
    auto_emotion: bool = True
    auto_pause: bool = True
    pronunciation: bool = True


# -------------------------------
# Helpers
# -------------------------------

def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, int(value)))


def error_response(message, status_code=500):
    raise HTTPException(
        status_code=status_code,
        detail=message
    )


# -------------------------------
# Load Edge Hindi Voices
# -------------------------------

async def refresh_edge_voices():
    global EDGE_VOICES
    global EDGE_VOICE_LIST

    try:
        voices = await edge_tts.list_voices()

        hindi_voices = [
            voice
            for voice in voices
            if voice.get("Locale") == "hi-IN"
        ]

        new_voices = {}

        for voice in hindi_voices:
            voice_id = voice.get("ShortName")

            if not voice_id:
                continue

            gender = voice.get("Gender", "")
            label = voice_id.replace("hi-IN-", "")

            if gender:
                label += f" — {gender}"

            new_voices[voice_id] = {
                "name": voice_id,
                "label": label
            }

        EDGE_VOICES = new_voices
        EDGE_VOICE_LIST = list(new_voices.keys())

        print(
            "EDGE VOICES LOADED:",
            len(EDGE_VOICE_LIST)
        )

    except Exception as exc:
        print(
            "EDGE VOICE LIST ERROR:",
            repr(exc)
        )


@app.on_event("startup")
async def startup_event():
    await refresh_edge_voices()


# -------------------------------
# Home Page
# -------------------------------

@app.get("/")
async def home():
    index_file = STATIC_DIR / "index.html"

    if not index_file.exists():
        raise HTTPException(
            status_code=500,
            detail="static/index.html नहीं मिली।"
        )

    return FileResponse(str(index_file))


# -------------------------------
# Health Check
# -------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "edge_voice_count": len(EDGE_VOICE_LIST)
    }


# -------------------------------
# Configuration API
# -------------------------------

@app.get("/api/config")
async def get_config():
    if not EDGE_VOICES:
        await refresh_edge_voices()

    return {
        "version": "PRO V3.2",

        "engines": [
            {
                "id": "edge",
                "label": "Edge TTS"
            },
            {
                "id": "azure",
                "label": "Azure Speech"
            }
        ],

        "voices": AZURE_VOICES,
        "edge_voices": EDGE_VOICES,

        "styles": [
            "neutral",
            "serious",
            "excited",
            "happy",
            "sad",
            "soft"
        ],

        "presets": [
            "custom",
            "facts",
            "motivation",
            "news",
            "story"
        ]
    }


# -------------------------------
# Select Edge Voice
# -------------------------------

def select_edge_voice(requested_voice):
    if requested_voice in EDGE_VOICES:
        return requested_voice

    gender_preferences = {
        "arjun": "Male",
        "madhur": "Male",
        "rehaan": "Male",
        "aarav": "Male",
        "kunal": "Male",
        "swara": "Female",
        "kavya": "Female",
        "ananya": "Female",
        "aarti": "Female"
    }

    preferred_gender = gender_preferences.get(
        requested_voice
    )

    if preferred_gender:
        for voice_id, voice_info in EDGE_VOICES.items():
            if voice_info["label"].endswith(
                "— " + preferred_gender
            ):
                return voice_id

    if EDGE_VOICE_LIST:
        return EDGE_VOICE_LIST[0]

    raise HTTPException(
        status_code=503,
        detail=(
            "Edge TTS की हिंदी आवाज़ें उपलब्ध नहीं हैं। "
            "कृपया कुछ देर बाद प्रयास करें।"
        )
    )


# -------------------------------
# Edge TTS Generation
# -------------------------------

async def make_edge_audio(data: TTSRequest):
    if not EDGE_VOICES:
        await refresh_edge_voices()

    voice_id = select_edge_voice(data.voice)
    voice_name = EDGE_VOICES[voice_id]["name"]

    rate = clamp(data.rate, -30, 30)
    pitch = clamp(data.pitch, -20, 20)
    volume = clamp(data.volume, -20, 20)

    temp_file = tempfile.NamedTemporaryFile(
        suffix=".mp3",
        delete=False
    )

    temp_path = temp_file.name
    temp_file.close()

    try:
        communicate = edge_tts.Communicate(
            text=data.text.strip(),
            voice=voice_name,
            rate=f"{rate:+d}%",
            pitch=f"{pitch * 5:+d}Hz",
            volume=f"{volume:+d}%"
        )

        await communicate.save(temp_path)

        if (
            not os.path.exists(temp_path)
            or os.path.getsize(temp_path) == 0
        ):
            raise RuntimeError(
                "Edge TTS ने खाली ऑडियो फ़ाइल बनाई।"
            )

        return temp_path

    except Exception as exc:
        print(
            "EDGE TTS GENERATION ERROR:",
            repr(exc)
        )

        try:
            os.remove(temp_path)
        except OSError:
            pass

        raise HTTPException(
            status_code=502,
            detail=(
                "Edge TTS आवाज़ नहीं बना सका। "
                f"विवरण: {str(exc)[:300]}"
            )
        )


# -------------------------------
# Azure TTS Generation
# -------------------------------

def make_azure_audio(data: TTSRequest):
    key = os.getenv(
        "AZURE_SPEECH_KEY",
        ""
    ).strip()

    region = os.getenv(
        "AZURE_SPEECH_REGION",
        ""
    ).strip()

    if not key or not region:
        raise HTTPException(
            status_code=503,
            detail=(
                "Azure Speech सक्रिय नहीं है। "
                "Edge TTS चुनकर कोशिश करें।"
            )
        )

    voice_info = AZURE_VOICES.get(
        data.voice,
        AZURE_VOICES["arjun"]
    )

    voice_name = voice_info["name"]

    rate = clamp(data.rate, -30, 30)
    pitch = clamp(data.pitch, -20, 20)
    volume = clamp(data.volume, -20, 20)

    safe_text = (
        data.text.strip()
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

    pitch_text = f"{pitch:+d}%"

    volume_text = (
        "default"
        if volume == 0
        else f"{volume:+d}%"
    )

    ssml = f"""
    <speak version="1.0"
        xmlns="http://www.w3.org/2001/10/synthesis"
        xml:lang="hi-IN">
        <voice name="{voice_name}">
            <prosody
                rate="{rate:+d}%"
                pitch="{pitch_text}"
                volume="{volume_text}">
                {safe_text}
            </prosody>
        </voice>
    </speak>
    """

    url = (
        f"https://{region}.tts.speech.microsoft.com/"
        "cognitiveservices/v1"
    )

    try:
        response = requests.post(
            url,
            headers={
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat":
                    "audio-24khz-48kbitrate-mono-mp3"
            },
            data=ssml.encode("utf-8"),
            timeout=45
        )

        if response.status_code != 200:
            print(
                "AZURE TTS ERROR:",
                response.status_code,
                response.text[:300]
            )

            raise HTTPException(
                status_code=502,
                detail=(
                    "Azure Speech अनुरोध विफल हुआ। "
                    f"HTTP {response.status_code}"
                )
            )

        temp_file = tempfile.NamedTemporaryFile(
            suffix=".mp3",
            delete=False
        )

        temp_file.write(response.content)
        temp_path = temp_file.name
        temp_file.close()

        if os.path.getsize(temp_path) == 0:
            os.remove(temp_path)

            raise HTTPException(
                status_code=502,
                detail="Azure ने खाली ऑडियो फ़ाइल दी।"
            )

        return temp_path

    except requests.RequestException as exc:
        print(
            "AZURE CONNECTION ERROR:",
            repr(exc)
        )

        raise HTTPException(
            status_code=502,
            detail="Azure Speech से कनेक्शन नहीं हो पाया।"
        )


# -------------------------------
# Generate Audio
# -------------------------------

async def generate_audio(data: TTSRequest):
    text = data.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="कृपया पहले स्क्रिप्ट लिखें।"
        )

    engine = data.engine.strip().lower()

    if engine == "edge":
        return await make_edge_audio(data)

    if engine == "azure":
        return await asyncio.to_thread(
            make_azure_audio,
            data
        )

    raise HTTPException(
        status_code=400,
        detail="अमान्य Voice Engine चुना गया है।"
    )


# -------------------------------
# Audio -> Base64 JSON
# -------------------------------

async def audio_response(
    data: TTSRequest,
    preview=False
):
    if preview:
        data.text = data.text[:350]

    temp_path = await generate_audio(data)

    try:
        with open(temp_path, "rb") as audio_file:
            audio_bytes = audio_file.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=502,
                detail="ऑडियो फ़ाइल खाली है।"
            )

        encoded_audio = base64.b64encode(
            audio_bytes
        ).decode("ascii")

        return JSONResponse(
            content={
                "success": True,
                "audio_base64": encoded_audio,
                "mime_type": "audio/mpeg",
                "filename": "voice.mp3"
            }
        )

    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


# -------------------------------
# Main Generate Endpoint
# -------------------------------

@app.post("/api/tts")
async def generate_tts(data: TTSRequest):
    return await audio_response(data)


# -------------------------------
# Preview Endpoint
# -------------------------------

@app.post("/api/preview")
async def preview_tts(data: TTSRequest):
    return await audio_response(
        data,
        preview=True
        )
