import os
import re
import asyncio
import tempfile
from pathlib import Path

import edge_tts
import requests

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


app = FastAPI(title="AI Voice Studio PRO V3")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

if STATIC_DIR.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(STATIC_DIR)),
        name="static"
    )


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

EDGE_VOICES = {}
EDGE_VOICE_LIST = []


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


def clamp(value, low, high):
    return max(low, min(high, int(value)))


async def refresh_edge_voices():
    global EDGE_VOICES, EDGE_VOICE_LIST

    try:
        voices = await edge_tts.list_voices()

        hindi_voices = [
            v for v in voices
            if v.get("Locale") == "hi-IN"
        ]

        EDGE_VOICES = {}
        EDGE_VOICE_LIST = []

        for v in hindi_voices:
            voice_id = v.get("ShortName", "")
            gender = v.get("Gender", "")
            if not voice_id:
                continue

            key = voice_id
            label = voice_id.replace("hi-IN-", "")

            if gender == "Male":
                label += " — Male"
            elif gender == "Female":
                label += " — Female"

            EDGE_VOICES[key] = {
                "name": voice_id,
                "label": label
            }

            EDGE_VOICE_LIST.append(key)

    except Exception as exc:
        print("EDGE VOICE LIST ERROR:", repr(exc))


@app.on_event("startup")
async def startup_event():
    await refresh_edge_voices()


@app.get("/")
async def home():
    index_file = STATIC_DIR / "index.html"

    if not index_file.exists():
        raise HTTPException(
            status_code=500,
            detail="static/index.html नहीं मिली।"
        )

    return FileResponse(str(index_file))


@app.get("/api/config")
async def get_config():
    if not EDGE_VOICES:
        await refresh_edge_voices()

    return {
        "version": "PRO V3.2",
        "engines": [
            {"id": "edge", "label": "Edge TTS"},
            {"id": "azure", "label": "Azure Speech"}
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


async def make_edge_audio(data: TTSRequest):
    if not EDGE_VOICES:
        await refresh_edge_voices()

    if not EDGE_VOICES:
        raise HTTPException(
            status_code=503,
            detail=(
                "Edge TTS से हिंदी आवाज़ों की सूची नहीं मिली। "
                "Render Logs में EDGE VOICE LIST ERROR देखें।"
            )
        )

    requested = data.voice

    if requested not in EDGE_VOICES:
        # पुराने dropdown के arjun/sw​ara जैसे विकल्पों के लिए fallback
        gender_preference = {
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

        preferred_gender = gender_preference.get(requested)

        matching = [
            key for key in EDGE_VOICE_LIST
            if preferred_gender
            and EDGE_VOICES[key]["label"].endswith(
                "— " + preferred_gender
            )
        ]

        requested = (
            matching[0]
            if matching
            else EDGE_VOICE_LIST[0]
        )

    voice_id = EDGE_VOICES[requested]["name"]

    rate = clamp(data.rate, -30, 30)
    pitch = clamp(data.pitch, -20, 20)
    volume = clamp(data.volume, -20, 20)

    communicate = edge_tts.Communicate(
        text=data.text.strip(),
        voice=voice_id,
        rate=f"{rate:+d}%",
        pitch=f"{pitch * 5:+d}Hz",
        volume=f"{volume:+d}%"
    )

    temp = tempfile.NamedTemporaryFile(
        suffix=".mp3",
        delete=False
    )
    temp_path = temp.name
    temp.close()

    try:
        await communicate.save(temp_path)

        if not os.path.exists(temp_path):
            raise RuntimeError("Audio file नहीं बनी।")

        if os.path.getsize(temp_path) == 0:
            raise RuntimeError("Audio file खाली है।")

        return temp_path

    except Exception as exc:
        print("EDGE TTS GENERATION ERROR:", repr(exc))

        try:
            os.remove(temp_path)
        except OSError:
            pass

        raise HTTPException(
            status_code=502,
            detail=f"Edge TTS आवाज़ नहीं बना सका: {str(exc)[:500]}"
        )


def make_azure_audio(data: TTSRequest):
    key = os.getenv("AZURE_SPEECH_KEY", "").strip()
    region = os.getenv("AZURE_SPEECH_REGION", "").strip()

    if not key or not region:
        raise HTTPException(
            status_code=503,
            detail=(
                "Azure Speech की key या region Render "
                "Environment Variables में उपलब्ध नहीं है। "
                "Edge TTS चुनकर कोशिश करें।"
            )
        )

    voice_info = AZURE_VOICES.get(data.voice)

    if not voice_info:
        voice_info = AZURE_VOICES["arjun"]

    voice_id = voice_info["name"]

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
        "default" if volume == 0 else f"{volume:+d}%"
    )

    ssml = f"""
    <speak version="1.0"
        xmlns="http://www.w3.org/2001/10/synthesis"
        xml:lang="hi-IN">
        <voice name="{voice_id}">
            <prosody rate="{rate:+d}%"
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
                "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
            },
            data=ssml.encode("utf-8"),
            timeout=45
        )

        if response.status_code != 200:
            print(
                "AZURE TTS ERROR:",
                response.status_code,
                response.text[:500]
            )

            raise HTTPException(
                status_code=502,
                detail=(
                    f"Azure Speech ने HTTP "
                    f"{response.status_code} दिया। "
                    "Edge TTS चुनकर कोशिश करें।"
                )
            )

        temp = tempfile.NamedTemporaryFile(
            suffix=".mp3",
            delete=False
        )

        temp.write(response.content)
        temp_path = temp.name
        temp.close()

        return temp_path

    except requests.RequestException as exc:
        print("AZURE CONNECTION ERROR:", repr(exc))

        raise HTTPException(
            status_code=502,
            detail="Azure Speech से कनेक्शन नहीं हो पाया।"
        )


async def generate_audio(data: TTSRequest):
    text = data.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="कृपया पहले स्क्रिप्ट लिखें।"
        )

    engine = data.engine.lower().strip()

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


async def audio_response(data: TTSRequest, preview=False):
    if preview:
        data.text = data.text[:350]

    temp_path = await generate_audio(data)

    return FileResponse(
        temp_path,
        media_type="audio/mpeg",
        filename="voice.mp3",
        background=None
    )


@app.post("/api/tts")
async def generate_tts(data: TTSRequest):
    return await audio_response(data)


@app.post("/api/preview")
async def preview_tts(data: TTSRequest):
    return await audio_response(data, preview=True)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "edge_voice_count": len(EDGE_VOICES)
    }
