import os
import re
import html
import base64

import requests
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
# VOICES
# ============================================================

VOICES = {

    "arjun": (
        "hi-IN-ArjunNeural",
        "Arjun — Male"
    ),

    "madhur": (
        "hi-IN-MadhurNeural",
        "Madhur — Male"
    ),

    "rehaan": (
        "hi-IN-RehaanNeural",
        "Rehaan — Male"
    ),

    "aarav": (
        "hi-IN-AaravNeural",
        "Aarav — Male"
    ),

    "kunal": (
        "hi-IN-KunalNeural",
        "Kunal — Male"
    ),

    "kavya": (
        "hi-IN-KavyaNeural",
        "Kavya — Female"
    ),

    "swara": (
        "hi-IN-SwaraNeural",
        "Swara — Female"
    ),

    "ananya": (
        "hi-IN-AnanyaNeural",
        "Ananya — Female"
    ),

    "aarti": (
        "hi-IN-AartiNeural",
        "Aarti — Female"
    ),

}


# ============================================================
# STYLES
# ============================================================

STYLES = [

    "neutral",
    "serious",
    "excited",
    "happy",
    "sad",
    "soft",

]


# ============================================================
# YOUTUBE PRESETS
# ============================================================

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
# FASTAPI
# ============================================================

app = FastAPI(
    title="AI Voice Studio PRO V3",
    version="3.0",
)


app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static",
)


# ============================================================
# REQUEST MODEL
# ============================================================

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


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return FileResponse(
        "static/index.html"
    )


# ============================================================
# CONFIG
# ============================================================

@app.get("/api/config")
def config():

    return {

        "version": "PRO V3",

        "voices": {

            key: {

                "name": value[0],

                "label": value[1],

            }

            for key, value in VOICES.items()

        },

        "styles": STYLES,

        "presets": PRESETS,

    }


# ============================================================
# EMOTION DETECTION
# ============================================================

def detect_emotion(text):

    lower = text.lower()


    if (

        "!" in text

        or any(

            word in lower

            for word in [

                "वाह",
                "कमाल",
                "जबरदस्त",
                "शानदार",
                "अविश्वसनीय",
                "सच में",
                "बड़ा खुलासा",

            ]

        )

    ):

        return "excited"


    if (

        "?" in text

        or any(

            word in lower

            for word in [

                "रहस्य",
                "हैरान",
                "चौंकाने",
                "चौंकाने वाला",
                "अजीब",
                "लेकिन क्या",
                "क्या आप जानते",

            ]

        )

    ):

        return "serious"


    if any(

        word in lower

        for word in [

            "दुख",
            "दर्द",
            "आंसू",
            "अकेला",
            "अकेली",
            "दुखद",
            "रोना",

        ]

    ):

        return "sad"


    if any(

        word in lower

        for word in [

            "खुशी",
            "मजेदार",
            "हंसी",
            "मजाक",
            "खुश",

        ]

    ):

        return "happy"


    return None


# ============================================================
# PRONUNCIATION
# ============================================================

def apply_pronunciation(text):

    escaped = html.escape(
        text,
        quote=True
    )


    for key in sorted(
        PRONUNCIATION,
        key=len,
        reverse=True
    ):

        alias = html.escape(
            PRONUNCIATION[key],
            quote=True
        )


        escaped = re.sub(

            re.escape(key),

            lambda match,
            a=alias:

            (
                f'<sub alias="{a}">'
                f'{html.escape(match.group(0))}'
                f'</sub>'
            ),

            escaped,

        )


    # Rupee

    escaped = re.sub(

        r'₹\s*([0-9][0-9,]*)',

        lambda match:

        (
            f'<sub alias="'
            f'{match.group(1).replace(",", " ")} रुपये'
            f'">'
            f'₹{match.group(1)}'
            f'</sub>'
        ),

        escaped,

    )


    # Percentage

    escaped = re.sub(

        r'\b([0-9][0-9,]*)%',

        lambda match:

        (
            f'<sub alias="'
            f'{match.group(1).replace(",", " ")} प्रतिशत'
            f'">'
            f'{match.group(1)}%'
            f'</sub>'
        ),

        escaped,

    )


    return escaped


# ============================================================
# NATURAL PAUSES
# ============================================================

def apply_pauses(text):

    text = re.sub(

        r'([।!?])\s+',

        r'\1<break time="420ms"/>',

        text

    )


    text = re.sub(

        r'([,;:])\s+',

        r'\1<break time="180ms"/>',

        text

    )


    text = re.sub(

        r'\n{2,}',

        '<break time="650ms"/>',

        text

    )


    return text


# ============================================================
# BODY PREPARATION
# ============================================================

def prepare_body(
    text,
    use_pause,
    use_pronunciation
):

    if not use_pause:

        if use_pronunciation:

            return apply_pronunciation(
                text
            )

        return html.escape(
            text,
            quote=True
        )


    paused = apply_pauses(
        text
    )


    parts = re.split(

        r'(<break time="'
        r'(?:180|420|650)'
        r'ms"/>)',

        paused

    )


    output = []


    for part in parts:

        if part.startswith(
            "<break "
        ):

            output.append(
                part
            )

        else:

            if use_pronunciation:

                output.append(
                    apply_pronunciation(
                        part
                    )
                )

            else:

                output.append(
                    html.escape(
                        part,
                        quote=True
                    )
                )


    return "".join(
        output
    )


# ============================================================
# BUILD SSML
# ============================================================

def build_ssml(x):

    rate = x.rate

    pitch = x.pitch

    volume = x.volume

    style = x.style


    # Preset

    if x.preset != "custom":

        preset = PRESETS[
            x.preset
        ]


        style = preset[
            "style"
        ]


        if x.rate == 0:

            rate = preset[
                "rate"
            ]


        if x.pitch == 0:

            pitch = preset[
                "pitch"
            ]


    # Automatic emotion

    if x.auto_emotion:

        detected =
            detect_emotion(
                x.text
            )


        if detected:

            style = detected


            if detected == "excited":

                rate = min(
                    30,
                    rate + 2
                )

                pitch = min(
                    20,
                    pitch + 1
                )


            elif detected == "serious":

                rate = max(
                    -30,
                    rate - 2
                )


            elif detected == "sad":

                rate = max(
                    -30,
                    rate - 3
                )

                pitch = max(
                    -20,
                    pitch - 1
                )


            elif detected == "happy":

                rate = min(
                    30,
                    rate + 2
                )


    # Voice director

    if x.auto_director:

        if style == "excited":

            rate = min(
                30,
                rate + 2
            )


        elif style == "soft":

            rate = max(
                -30,
                rate - 2
            )


        elif style == "sad":

            rate = max(
                -30,
                rate - 2
            )


    body = prepare_body(

        x.text,

        x.auto_pause,

        x.pronunciation

    )


    return (

        '<speak version="1.0" '

        'xmlns="http://www.w3.org/2001/10/synthesis" '

        'xml:lang="hi-IN">'

        f'<voice name="'
        f'{VOICES[x.voice][0]}'
        f'">'

        f'<prosody '
        f'rate="{rate}%" '
        f'pitch="{pitch}%" '
        f'volume="{volume}%">'

        f'{body}'

        '</prosody>'

        '</voice>'

        '</speak>'

    )


# ============================================================
# AZURE REQUEST
# ============================================================

def azure_tts(
    x
):

    if not KEY:

        raise HTTPException(

            status_code=500,

            detail=
            "Azure Speech key server पर configured नहीं है।"

        )


    ssml = build_ssml(
        x
    )


    url = (

        f"https://{REGION}"

        ".tts.speech.microsoft.com/"

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
            "AI-Voice-Studio-PRO-V3",

    }


    try:

        response = requests.post(

            url,

            headers=headers,

            data=ssml.encode(
                "utf-8"
            ),

            timeout=60,

        )


    except requests.RequestException as error:

        raise HTTPException(

            status_code=502,

            detail=
            "Azure connection error: "
            + str(error)

        )


    if response.status_code != 200:

        raise HTTPException(

            status_code=
                response.status_code,

            detail=
                "Azure TTS error: "
                + response.text[:800]

        )


    return response.content


# ============================================================
# VALIDATION
# ============================================================

def validate_request(x):

    if x.voice not in VOICES:

        raise HTTPException(

            status_code=400,

            detail="Invalid voice"

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
# FULL TTS
# ============================================================

@app.post("/api/tts")
def tts(x: Req):

    validate_request(
        x
    )


    audio = azure_tts(
        x
    )


    return JSONResponse({

        "audio_base64":
            base64.b64encode(
                audio
            ).decode(),

        "mime":
            "audio/mpeg",

        "version":
            "PRO V3",

        "characters":
            len(x.text),

    })


# ============================================================
# QUICK PREVIEW
# ============================================================

@app.post("/api/preview")
def preview(x: Req):

    validate_request(
        x
    )


    # Preview को छोटा रखें।

    preview_text = (
        x.text[:350]
    )


    preview_request = x.model_copy(
        update={
            "text": preview_text
        }
    )


    audio = azure_tts(
        preview_request
    )


    return JSONResponse({

        "audio_base64":
            base64.b64encode(
                audio
            ).decode(),

        "mime":
            "audio/mpeg",

        "version":
            "PRO V3 PREVIEW",

        "characters":
            len(preview_text),

    })
