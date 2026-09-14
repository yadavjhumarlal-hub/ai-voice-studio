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
    "kunal": ("hi-IN-KunalNeural", "Kunal — Male"),
}

STYLES = [
    "neutral",
    "serious",
    "excited",
    "happy",
    "sad",
    "soft"
]

app = FastAPI(title="AI Voice Studio PRO")

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


class Req(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    voice: str = "arjun"
    style: str = "neutral"
    rate: int = Field(0, ge=-30, le=30)
    pitch: int = Field(0, ge=-20, le=20)
    volume: int = Field(0, ge=-20, le=20)

PRONUNCIATION = {
    "AI": "एआई",
    "Ai": "एआई",
    "ai": "एआई",
    "YouTube": "यूट्यूब",
    "youtube": "यूट्यूब",
    "Google": "गूगल",
    "Instagram": "इंस्टाग्राम",
    "Facebook": "फेसबुक",
    "WhatsApp": "व्हाट्सऐप",
    "NASA": "नासा",
    "ISRO": "इसरो",
    "भारत": "भारत",
    "₹": "रुपये",
    "5G": "फाइव जी",
    "4G": "फोर जी",
    "3G": "थ्री जी",
    "100%": "सौ प्रतिशत",
    "COVID-19": "कोविड उन्नीस",
    "COVID": "कोविड",
    "USB": "यूएसबी",
    "GPS": "जीपीएस",
    "OTP": "ओटीपी",
    "UPI": "यूपीआई",
    "ATM": "एटीएम",
    "NASA": "नासा",
    "ISRO": "इसरो",
}


def apply_pronunciation(text):
    """
    Common Hindi/English technical words
    को natural spoken Hindi में बदलता है।
    """

    # Longer phrases first
    replacements = sorted(
        PRONUNCIATION.items(),
        key=lambda item: len(item[0]),
        reverse=True
    )

    for original, spoken in replacements:
        pattern = r"(?<!\w)" + re.escape(original) + r"(?!\w)"

        text = re.sub(
            pattern,
            lambda m: (
                f'<sub alias="{html.escape(spoken)}">'
                f'{html.escape(m.group(0))}'
                f'</sub>'
            ),
            text
        )

    return text
def clean_text(text):
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def make_natural_ssml(text, rate, pitch, volume, style):
    """
    AI Voice Director:
    - Natural pauses
    - Sentence rhythm
    - Hook treatment
    - Emotion based delivery
    """

    text = clean_text(text)

    # Basic emotion tuning
    style_rate = rate
    style_pitch = pitch

    if style == "soft":
        style_rate = max(-30, rate - 5)
        style_pitch = pitch - 1

    elif style == "excited":
        style_rate = min(30, rate + 6)
        style_pitch = pitch + 2

    elif style == "happy":
        style_rate = min(30, rate + 3)
        style_pitch = pitch + 1

    elif style == "sad":
        style_rate = max(-30, rate - 5)
        style_pitch = pitch - 2

    elif style == "serious":
        style_rate = max(-30, rate - 2)
        style_pitch = pitch - 1

    # Escape first for XML safety
    safe = apply_pronunciation(text)

    # Natural punctuation pauses
    safe = re.sub(
        r",",
        ',<break time="180ms"/>',
        safe
    )

    safe = re.sub(
        r";",
        ';<break time="220ms"/>',
        safe
    )

    safe = re.sub(
        r":",
        ':<break time="180ms"/>',
        safe
    )

    safe = re.sub(
        r"([!?])",
        r'\1<break time="380ms"/>',
        safe
    )

    safe = re.sub(
        r"\.",
        '.<break time="300ms"/>',
        safe
    )

    # New line = natural pause
    safe = re.sub(
        r"\n+",
        '<break time="450ms"/>',
        safe
    )

    # Detect first sentence as Shorts hook
    sentences = re.split(r"(?<=[.!?।])\s+", text.strip())

    hook = ""
    if sentences and len(sentences[0].strip()) >= 8:
        hook = sentences[0].strip()

    # Build SSML
    body = safe

    # Important/common words get slight emphasis through prosody
    important_words = [
        "लेकिन",
        "क्योंकि",
        "ध्यान",
        "महत्वपूर्ण",
        "सच",
        "सच्चाई",
        "राज",
        "रहस्य",
        "खास",
        "चौंकाने",
        "चौंकाने वाला",
        "जानकर",
        "क्या आप जानते हैं",
        "सबसे",
        "पहली बार",
        "अविश्वसनीय"
    ]

    for word in important_words:
        escaped_word = html.escape(word)

        body = re.sub(
            rf"(?<![\w]){re.escape(escaped_word)}(?![\w])",
            f'<prosody pitch="+1st" rate="-3%"><emphasis level="moderate">{escaped_word}</emphasis></prosody>',
            body,
            flags=re.IGNORECASE
        )

    # Extra hook treatment
    if hook:
        escaped_hook = html.escape(hook)

        hook_pattern = re.escape(escaped_hook)
        replacement = (
            '<prosody rate="-3%" pitch="+2st">'
            + escaped_hook
            + '</prosody>'
            '<break time="280ms"/>'
        )

        body = re.sub(
            hook_pattern,
            replacement,
            body,
            count=1
        )

    ssml = (
        '<speak version="1.0" '
        'xmlns="http://www.w3.org/2001/10/synthesis" '
        'xml:lang="hi-IN">'
        f'<voice name="{VOICES["arjun"][0]}">'
        f'<prosody rate="{style_rate}%" '
        f'pitch="{style_pitch}%" '
        f'volume="{volume}%">'
        f'{body}'
        '</prosody>'
        '</voice>'
        '</speak>'
    )

    return ssml


@app.get("/")
def home():
    return FileResponse("static/index.html")


@app.get("/api/config")
def config():
    return {
        "voices": {
            k: {
                "name": v[0],
                "label": v[1]
            }
            for k, v in VOICES.items()
        },
        "styles": STYLES
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

    # Voice selected by user
    voice_name = VOICES[x.voice][0]

    # Style-specific speed
    rate = x.rate

    if x.style == "soft":
        rate = max(-30, rate - 5)

    elif x.style == "excited":
        rate = min(30, rate + 6)

    elif x.style == "happy":
        rate = min(30, rate + 3)

    elif x.style == "sad":
        rate = max(-30, rate - 5)

    elif x.style == "serious":
        rate = max(-30, rate - 2)

    # Generate professional SSML
    ssml = make_natural_ssml(
        x.text,
        rate,
        x.pitch,
        x.volume,
        x.style
    )

    # Azure Speech endpoint
    url = (
        f"https://{REGION}.tts.speech.microsoft.com/"
        "cognitiveservices/v1"
    )

    headers = {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat":
            "audio-24khz-160kbitrate-mono-mp3",
        "User-Agent": "AI-Voice-Studio-PRO"
    }

    # Replace hard-coded Arjun voice with selected voice
    ssml = ssml.replace(
        'voice name="hi-IN-ArjunNeural"',
        f'voice name="{voice_name}"'
    )

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
            "Azure connection error: " + str(e)
        )

    if response.status_code != 200:
        raise HTTPException(
            response.status_code,
            "Azure TTS error: " + response.text[:800]
        )

    return JSONResponse({
        "audio_base64": base64.b64encode(
            response.content
        ).decode(),
        "mime": "audio/mpeg"
    })
