import os
import re
import html
import base64
import asyncio
import tempfile
from pathlib import Path

import requests
import edge_tts

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

KEY = os.getenv("AZURE_SPEECH_KEY", "").strip()

REGION = os.getenv(
    "AZURE_SPEECH_REGION",
    "centralindia"
).strip()


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AI Voice Studio PRO V3",
    version="3.1"
)

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


# ============================================================
# AZURE VOICES
# ============================================================

VOICES = {
    "arjun": ("hi-IN-ArjunNeural", "Arjun — Male"),
    "madhur": ("hi-IN-MadhurNeural", "Madhur — Male"),
    "rehaan": ("hi-IN-RehaanNeural", "Rehaan — Male"),
    "aarav": ("hi-IN-AaravNeural", "Aarav — Male"),
    "kunal": ("hi-IN-KunalNeural", "Kunal — Male"),
    "kavya": ("hi-IN-KavyaNeural", "Kavya — Female"),
    "swara": ("hi-IN-SwaraNeural", "Swara — Female"),
    "ananya": ("hi-IN-AnanyaNeural", "Ananya — Female"),
    "aarti": ("hi-IN-AartiNeural", "Aarti — Female"),
}


# ============================================================
# EDGE TTS VOICES
# Voice IDs are checked by the Edge TTS service at runtime.
# ============================================================

EDGE_VOICES = {
    "arjun": ("hi-IN-ArjunNeural", "Arjun — Male"),
    "madhur": ("hi-IN-MadhurNeural", "Madhur — Male"),
    "rehaan": ("hi-IN-RehaanNeural", "Rehaan — Male"),
    "aarav": ("hi-IN-AaravNeural", "Aarav — Male"),
    "kunal": ("hi-IN-KunalNeural", "Kunal — Male"),
    "kavya": ("hi-IN-KavyaNeural", "Kavya — Female"),
    "swara": ("hi-IN-SwaraNeural", "Swara — Female"),
    "ananya": ("hi-IN-AnanyaNeural", "Ananya — Female"),
    "aarti": ("hi-IN-AartiNeural", "Aarti — Female"),
}


# ============================================================
# STYLES AND PRESETS
# ============================================================

STYLES = [
    "neutral",
    "serious",
    "excited",
    "happy",
    "sad",
    "soft",
]

PRESETS = {
    "custom": {
        "style": "neutral",
        "rate": 0,
        "pitch": 0,
    },
    "viral_fact": {
        "style": "excited",
        "rate": 5,
        "pitch": 1,
    },
    "news": {
        "style": "serious",
        "rate": -2,
        "pitch": -1,
    },
    "mystery": {
        "style": "serious",
        "rate": -7,
        "pitch": -2,
    },
    "story": {
        "style": "soft",
        "rate": -3,
        "pitch": 0,
    },
    "education": {
        "style": "neutral",
        "rate": -1,
        "pitch": 0,
    },
    "emotional": {
        "style": "sad",
        "rate": -7,
        "pitch": -2,
    },
    "motivation": {
        "style": "excited",
        "rate": 3,
        "pitch": 1,
    },
    "funny": {
        "style": "happy",
        "rate": 3,
        "pitch": 1,
    },
}


# ============================================================
# SMART PRONUNCIATION
# ============================================================

PRONUNCIATION = {
    "YouTube": "यूट्यूब",
    "Youtube": "यूट्यूब",
    "NASA": "नासा",
    "Nasa": "नासा",
    "ISRO": "इसरो",
    "Isro": "इसरो",
    "AI": "एआई",
    "5G": "फाइव जी",
    "4G": "फोर जी",
    "3G": "थ्री जी",
    "USB": "यूएसबी",
    "GPS": "जीपीएस",
    "OTP": "ओटीपी",
    "UPI": "यूपीआई",
    "ATM": "एटीएम",
    "CPU": "सीपीयू",
    "PDF": "पीडीएफ",
    "URL": "यूआरएल",
    "COVID": "कोविड",
    "Google": "गूगल",
    "WhatsApp": "व्हाट्सऐप",
    "Instagram": "इंस्टाग्राम",
    "Facebook": "फेसबुक",
}


# ============================================================
# REQUEST MODEL
# ============================================================

class Req(BaseModel):

    text: str = Field(
        min_length=1,
        max_length=12000
    )

    engine: str = "azure"

    voice: str = "arjun"

    style: str = "neutral"

    preset: str = "custom"

    rate: int = Field(
        default=0,
        ge=-30,
        le=30
    )

    pitch: int = Field(
        default=0,
        ge=-20,
        le=20
    )

    volume: int = Field(
        default=0,
        ge=-20,
        le=20
    )

    auto_director: bool = True

    auto_emotion: bool = True

    auto_pause: bool = True

    pronunciation: bool = True


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return FileResponse("static/index.html")


# ============================================================
# CONFIG
# ============================================================

@app.get("/api/config")
def config():

    return {
        "version": "PRO V3.1",

        "engines": [
            {
                "id": "azure",
                "label": "Azure Speech"
            },
            {
                "id": "edge",
                "label": "Edge TTS"
            }
        ],

        "voices": {
            key: {
                "name": value[0],
                "label": value[1]
            }
            for key, value in VOICES.items()
        },

        "edge_voices": {
            key: {
                "name": value[0],
                "label": value[1]
            }
            for key, value in EDGE_VOICES.items()
        },

        "styles": STYLES,

        "presets": PRESETS,
    }


# ============================================================
# EMOTION DETECTION
# ============================================================

def detect_emotion(text):

    lower = text.lower()

    if "!" in text or any(word in lower for word in [
        "वाह",
        "कमाल",
        "जबरदस्त",
        "शानदार",
        "अविश्वसनीय",
        "बड़ा खुलासा",
    ]):
        return "excited"

    if "?" in text or any(word in lower for word in [
        "रहस्य",
        "हैरान",
        "चौंकाने",
        "अजीब",
        "क्या आप जानते",
    ]):
        return "serious"

    if any(word in lower for word in [
        "दुख",
        "दर्द",
        "आंसू",
        "अकेला",
        "अकेली",
        "दुखद",
    ]):
        return "sad"

    if any(word in lower for word in [
        "खुशी",
        "मजेदार",
        "हंसी",
        "मजाक",
        "खुश",
    ]):
        return "happy"

    return None


# ============================================================
# TEXT PROCESSING
# ============================================================

def clean_text(text, pronunciation=True, pauses=True):

    result = text

    if pronunciation:
        for word in sorted(
            PRONUNCIATION,
            key=len,
            reverse=True
        ):
            result = re.sub(
                re.escape(word),
                lambda _: PRONUNCIATION[word],
                result
            )

    if pauses:
        # Edge TTS receives plain text, not Azure SSML.
        # Preserve punctuation and paragraph breaks naturally.
        result = re.sub(
            r"[ \t]+",
            " ",
            result
        )

        result = re.sub(
            r"\n{3,}",
            "\n\n",
            result
        )

    return result.strip()


# ============================================================
# EFFECTIVE VOICE SETTINGS
# ============================================================

def effective_settings(x):

    rate = x.rate
    pitch = x.pitch
    volume = x.volume
    style = x.style

    preset = PRESETS[x.preset]

    if x.preset != "custom":

        style = preset["style"]

        if x.rate == 0:
            rate = preset["rate"]

        if x.pitch == 0:
            pitch = preset["pitch"]

    if x.auto_emotion:

        detected = detect_emotion(x.text)

        if detected:
            style = detected

            if detected == "excited":
                rate = min(30, rate + 2)
                pitch = min(20, pitch + 1)

            elif detected == "serious":
                rate = max(-30, rate - 2)

            elif detected == "sad":
                rate = max(-30, rate - 3)
                pitch = max(-20, pitch - 1)

            elif detected == "happy":
                rate = min(30, rate + 2)

    if x.auto_director:

        if style == "excited":
            rate = min(30, rate + 2)

        elif style in ("soft", "sad"):
            rate = max(-30, rate - 2)

    return rate, pitch, volume, style


# ============================================================
# AZURE SSML
# ============================================================

def azure_prepare_text(x):

    text = x.text

    if x.pronunciation:

        for word in sorted(
            PRONUNCIATION,
            key=len,
            reverse=True
        ):
            text = re.sub(
                re.escape(word),
                lambda _: (
                    f'<sub alias="'
                    f'{html.escape(PRONUNCIATION[word])}'
                    f'">'
                    f'{html.escape(word)}'
                    f'</sub>'
                ),
                text
            )

    if not x.pronunciation:
        text = html.escape(text)

    if x.auto_pause:

        text = re.sub(
            r"([।!?])\s+",
            r'\1<break time="420ms"/>',
            text
        )

        text = re.sub(
            r"([,;:])\s+",
            r'\1<break time="180ms"/>',
            text
        )

        text = re.sub(
            r"\n{2,}",
            '<break time="650ms"/>',
            text
        )

    return text


def build_ssml(x):

    rate, pitch, volume, _ = effective_settings(x)

    body = azure_prepare_text(x)

    # Use Azure's relative prosody syntax.
    rate_text = f"{rate:+d}%"

    pitch_text = f"{pitch:+d}%"

    if volume == 0:
        volume_text = "default"
    else:
        volume_text = f"{volume:+d}%"

    voice_name = VOICES[x.voice][0]

    return (
        '<speak version="1.0" '
        'xmlns="http://www.w3.org/2001/10/synthesis" '
        'xml:lang="hi-IN">'
        f'<voice name="{voice_name}">'
        f'<prosody rate="{rate_text}" '
        f'pitch="{pitch_text}" '
        f'volume="{volume_text}">'
        f'{body}'
        '</prosody>'
        '</voice>'
        '</speak>'
    )


# ============================================================
# AZURE TTS
# ============================================================

def azure_tts(x):

    if not KEY:
        raise HTTPException(
            status_code=503,
            detail=(
                "Azure Speech Key configured नहीं है "
                "या Azure Subscription बंद है। "
                "Edge TTS चुनकर कोशिश करें।"
            )
        )

    ssml = build_ssml(x)

    url = (
        f"https://{REGION}"
        ".tts.speech.microsoft.com/"
        "cognitiveservices/v1"
    )

    headers = {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat":
            "audio-24khz-160kbitrate-mono-mp3",
        "User-Agent": "AI-Voice-Studio-PRO-V3",
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            data=ssml.encode("utf-8"),
            timeout=60,
        )

    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Azure से कनेक्शन नहीं हो पाया।"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=(
                "Azure TTS उपलब्ध नहीं है। "
                "Edge TTS चुनकर कोशिश करें।"
            )
        )

    return response.content


# ============================================================
# EDGE TTS
# ============================================================

async def edge_tts_audio(x):

    voice_info = EDGE_VOICES.get(x.voice)

    if not voice_info:
        raise HTTPException(
            status_code=400,
            detail="यह Edge TTS Voice उपलब्ध नहीं है।"
        )

    rate, pitch, volume, _ = effective_settings(x)

    text = clean_text(
        x.text,
        pronunciation=x.pronunciation,
        pauses=x.auto_pause
    )

    # Edge TTS uses relative percentage values.
    rate_value = f"{rate:+d}%"

    # Edge TTS pitch is expressed in Hz.
    # Keep the pitch adjustment modest.
    pitch_hz = max(-100, min(100, pitch * 5))

    pitch_value = f"{pitch_hz:+d}Hz"

    # Edge TTS volume uses percentage offsets.
    volume_value = f"{volume:+d}%"

    try:

        communicate = edge_tts.Communicate(
            text=text,
            voice=voice_info[0],
            rate=rate_value,
            pitch=pitch_value,
            volume=volume_value,
        )

        with tempfile.NamedTemporaryFile(
            suffix=".mp3",
            delete=False
        ) as temp_file:
            temp_path = temp_file.name

        try:

            await communicate.save(temp_path)

            audio = Path(temp_path).read_bytes()

        finally:

            try:
                os.remove(temp_path)
            except OSError:
                pass

        if not audio:
            raise RuntimeError("खाली ऑडियो मिला।")

        return audio

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=502,
            detail=(
                "Edge TTS से आवाज़ नहीं बन पाई। "
                "इंटरनेट या Voice की उपलब्धता जाँचें।"
            )
        )


# ============================================================
# VALIDATION
# ============================================================

def validate_request(x):

    if x.engine not in ("azure", "edge"):
        raise HTTPException(
            status_code=400,
            detail="Invalid engine"
        )

    voices = VOICES if x.engine == "azure" else EDGE_VOICES

    if x.voice not in voices:
        raise HTTPException(
            status_code=400,
            detail="Invalid voice for selected engine"
        )

    if x.style not in STYLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid style"
        )

    if x.preset not in PRESETS:
        raise HTTPException(
            status_code=400,
            detail="Invalid preset"
        )


# ============================================================
# GENERATE AUDIO
# ============================================================

async def generate_audio(x):

    validate_request(x)

    if x.engine == "azure":
        return azure_tts(x)

    return await edge_tts_audio(x)


def audio_response(audio, x, version):

    return JSONResponse({
        "audio_base64": base64.b64encode(audio).decode("ascii"),
        "mime": "audio/mpeg",
        "version": version,
        "engine": x.engine,
        "characters": len(x.text),
    })


# ============================================================
# FULL TTS
# ============================================================

@app.post("/api/tts")
async def tts(x: Req):

    audio = await generate_audio(x)

    return audio_response(
        audio,
        x,
        "PRO V3.1"
    )


# ============================================================
# QUICK PREVIEW
# ============================================================

@app.post("/api/preview")
async def preview(x: Req):

    preview_text = x.text[:350]

    preview_request = x.model_copy(
        update={"text": preview_text}
    )

    audio = await generate_audio(preview_request)

    return audio_response(
        audio,
        preview_request,
        "PRO V3.1 PREVIEW"
)
