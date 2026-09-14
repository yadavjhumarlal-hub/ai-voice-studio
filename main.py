import os
import html
import base64
import re

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import requests
from dotenv import load_dotenv


load_dotenv()


KEY = os.getenv("AZURE_SPEECH_KEY", "").strip()
REGION = os.getenv("AZURE_SPEECH_REGION", "centralindia").strip()


VOICES = {
    "arjun": ("hi-IN-ArjunNeural", "Arjun — Male"),
    "madhur": ("hi-IN-MadhurNeural", "Madhur — Male"),
    "rehaan": ("hi-IN-RehaanNeural", "Rehaan — Male"),
    "aarav": ("hi-IN-AaravNeural", "Aarav — Male"),
    "kavya": ("hi-IN-KavyaNeural", "Kavya — Female"),
    "swara": ("hi-IN-SwaraNeural", "Swara — Female"),
    "ananya": ("hi-IN-AnanyaNeural", "Ananya — Female"),
    "aarti": ("hi-IN-AartiNeural", "Aarti — Female"),
    "kunal": ("hi-IN-KunalNeural", "Kunal — Male")
}


STYLES = [
    "neutral",
    "serious",
    "excited",
    "happy",
    "sad",
    "soft"
]


PRESETS = {
    "custom": {
        "style": "neutral",
        "rate": 0,
        "pitch": 0
    },

    "viral_fact": {
        "style": "excited",
        "rate": 5,
        "pitch": 1
    },

    "news": {
        "style": "serious",
        "rate": -2,
        "pitch": -1
    },

    "mystery": {
        "style": "serious",
        "rate": -7,
        "pitch": -2
    },

    "story": {
        "style": "soft",
        "rate": -3,
        "pitch": 0
    },

    "education": {
        "style": "neutral",
        "rate": -1,
        "pitch": 0
    },

    "emotional": {
        "style": "sad",
        "rate": -7,
        "pitch": -2
    },

    "motivation": {
        "style": "excited",
        "rate": 3,
        "pitch": 1
    },

    "funny": {
        "style": "happy",
        "rate": 3,
        "pitch": 1
    }
}


PRONUNCIATION = {
    "YouTube": "यूट्यूब",
    "youtube": "यूट्यूब",
    "Google": "गूगल",
    "Instagram": "इंस्टाग्राम",
    "Facebook": "फेसबुक",
    "WhatsApp": "व्हाट्सऐप",
    "NASA": "नासा",
    "ISRO": "इसरो",
    "AI": "एआई",
    "Ai": "एआई",
    "ai": "एआई",
    "5G": "फाइव जी",
    "4G": "फोर जी",
    "3G": "थ्री जी",
    "USB": "यूएसबी",
    "GPS": "जीपीएस",
    "OTP": "ओटीपी",
    "UPI": "यूपीआई",
    "ATM": "एटीएम",
    "COVID-19": "कोविड उन्नीस",
    "COVID": "कोविड",
    
}


app = FastAPI(title="AI Voice Studio PRO")


app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


class Req(BaseModel):

    text: str = Field(
        min_length=1,
        max_length=12000
    )

    voice: str = "arjun"

    style: str = "neutral"

    preset: str = "custom"

    rate: int = Field(
        0,
        ge=-30,
        le=30
    )

    pitch: int = Field(
        0,
        ge=-20,
        le=20
    )

    volume: int = Field(
        0,
        ge=-20,
        le=20
    )

    auto_director: bool = True

    auto_emotion: bool = True

    auto_pause: bool = True

    pronunciation: bool = True


def clean_text(text):

    text = text.replace(
        "\r\n",
        "\n"
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text.strip()


def detect_emotion(text, current_style):

    lower = text.lower()

    excited_words = [
        "चौंकाने",
        "अविश्वसनीय",
        "हैरान",
        "क्या आप जानते",
        "कमाल",
        "शानदार",
        "जबरदस्त",
        "रहस्य"
    ]

    sad_words = [
        "दुख",
        "दर्द",
        "अकेला",
        "अकेली",
        "मौत",
        "खो दिया",
        "रोना",
        "आंसू"
    ]

    serious_words = [
        "सावधान",
        "महत्वपूर्ण",
        "खतरा",
        "चेतावनी",
        "जरूरी",
        "ध्यान दें"
    ]

    happy_words = [
        "खुशी",
        "खुश",
        "मुस्कान",
        "शुभकामना",
        "बधाई",
        "जीत"
    ]

    if any(word in lower for word in excited_words):
        return "excited"

    if any(word in lower for word in sad_words):
        return "sad"

    if any(word in lower for word in serious_words):
        return "serious"

    if any(word in lower for word in happy_words):
        return "happy"

    return current_style


def apply_pronunciation(text):

    safe = html.escape(text)

    # Currency
    safe = re.sub(
        r"₹\s*([0-9][0-9,]*)",
        lambda m:
        '<sub alias="' +
        html.escape(
            m.group(1).replace(",", "")
            + " रुपये"
        ) +
        '">' +
        html.escape(m.group(0)) +
        '</sub>',
        safe
    )

    # Percent
    safe = re.sub(
        r"([0-9]+)%",
        lambda m:
        '<sub alias="' +
        html.escape(
            m.group(1) + " प्रतिशत"
        ) +
        '">' +
        html.escape(m.group(0)) +
        '</sub>',
        safe
    )

    replacements = sorted(
        PRONUNCIATION.items(),
        key=lambda item: len(item[0]),
        reverse=True
    )

    for original, spoken in replacements:

        pattern = (
            r"(?<![\w])"
            + re.escape(
                html.escape(original)
            )
            + r"(?![\w])"
        )

        safe = re.sub(
            pattern,
            lambda m:
            '<sub alias="' +
            html.escape(spoken) +
            '">' +
            m.group(0) +
            '</sub>',
            safe
        )

    return safe


def apply_pauses(text):

    text = re.sub(
        r",",
        ',<break time="180ms"/>',
        text
    )

    text = re.sub(
        r";",
        ';<break time="220ms"/>',
        text
    )

    text = re.sub(
        r":",
        ':<break time="180ms"/>',
        text
    )

    text = re.sub(
        r"([!?])",
        r'\1<break time="380ms"/>',
        text
    )

    text = re.sub(
        r"([।])",
        r'\1<break time="320ms"/>',
        text
    )

    text = re.sub(
        r"\.",
        '.<break time="300ms"/>',
        text
    )

    text = re.sub(
        r"\n+",
        '<break time="450ms"/>',
        text
    )

    return text


def build_ssml(
    text,
    voice_name,
    style,
    rate,
    pitch,
    volume,
    auto_director,
    auto_emotion,
    auto_pause,
    pronunciation
):

    text = clean_text(text)

    if auto_emotion:
        style = detect_emotion(
            text,
            style
        )

    if auto_director:

        if style == "soft":
            rate -= 5
            pitch -= 1

        elif style == "excited":
            rate += 5
            pitch += 1

        elif style == "happy":
            rate += 3
            pitch += 1

        elif style == "sad":
            rate -= 5
            pitch -= 2

        elif style == "serious":
            rate -= 2
            pitch -= 1


    rate = max(
        -30,
        min(30, rate)
    )

    pitch = max(
        -20,
        min(20, pitch)
    )

    volume = max(
        -20,
        min(20, volume)
    )


    if pronunciation:

        body = apply_pronunciation(
            text
        )

    else:

        body = html.escape(
            text
        )


    if auto_pause:

        body = apply_pauses(
            body
        )


    ssml = (
        '<speak version="1.0" '
        'xmlns="http://www.w3.org/2001/10/synthesis" '
        'xml:lang="hi-IN">'
        f'<voice name="{voice_name}">'
        f'<prosody '
        f'rate="{rate}%" '
        f'pitch="{pitch}%" '
        f'volume="{volume}%">'
        f'{body}'
        '</prosody>'
        '</voice>'
        '</speak>'
    )

    return ssml


@app.get("/")
def home():

    return FileResponse(
        "static/index.html"
    )


@app.get("/api/config")
def config():

    return {
        "voices": {
            key: {
                "name": value[0],
                "label": value[1]
            }
            for key, value in VOICES.items()
        },

        "styles": STYLES,

        "presets": PRESETS
    }


@app.post("/api/tts")
def tts(x: Req):

    if not KEY:

        raise HTTPException(
            500,
            "Azure key .env में सेट नहीं है।"
        )


    if x.voice not in VOICES:

        raise HTTPException(
            400,
            "Invalid voice"
        )


    if x.style not in STYLES:

        raise HTTPException(
            400,
            "Invalid style"
        )


    # Preset values
    rate = x.rate
    pitch = x.pitch
    style = x.style

    if x.preset in PRESETS and x.preset != "custom":

        preset = PRESETS[x.preset]

        style = preset["style"]

        # Only use preset defaults
        # when user has not manually changed
        # the controls significantly.
        rate = x.rate
        pitch = x.pitch


    voice_name = VOICES[x.voice][0]


    ssml = build_ssml(
        text=x.text,

        voice_name=voice_name,

        style=style,

        rate=rate,

        pitch=pitch,

        volume=x.volume,

        auto_director=x.auto_director,

        auto_emotion=x.auto_emotion,

        auto_pause=x.auto_pause,

        pronunciation=x.pronunciation
    )


    url = (
        f"https://{REGION}.tts.speech.microsoft.com/"
        "cognitiveservices/v1"
    )


    headers = {

        "Ocp-Apim-Subscription-Key":
            KEY,

        "Content-Type":
            "application/ssml+xml",

        "X-Microsoft-OutputFormat":
            "audio-24khz-160kbitrate-mono-mp3",

        "User-Agent":
            "AI-Voice-Studio-PRO"
    }


    try:

        response = requests.post(
            url,
            headers=headers,
            data=ssml.encode("utf-8"),
            timeout=60
        )

    except requests.RequestException as e:

        raise HTTPException(
            502,
            "Azure connection error: "
            + str(e)
        )


    if response.status_code != 200:

        raise HTTPException(
            response.status_code,
            "Azure TTS error: "
            + response.text[:800]
        )


    return JSONResponse({

        "audio_base64":
            base64.b64encode(
                response.content
            ).decode(),

        "mime":
            "audio/mpeg"

    })
