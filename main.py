import os,html,base64
from fastapi import FastAPI,HTTPException
from fastapi.responses import FileResponse,JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field
import requests
from dotenv import load_dotenv
load_dotenv()
KEY=os.getenv("AZURE_SPEECH_KEY","").strip()
REGION=os.getenv("AZURE_SPEECH_REGION","centralindia").strip()
VOICES={"arjun":("hi-IN-ArjunNeural","Arjun — Male"),"madhur":("hi-IN-MadhurNeural","Madhur — Male"),"rehaan":("hi-IN-RehaanNeural","Rehaan — Male"),"aarav":("hi-IN-AaravNeural","Aarav — Male"),"kavya":("hi-IN-KavyaNeural","Kavya — Female"),"swara":("hi-IN-SwaraNeural","Swara — Female"),"ananya":("hi-IN-AnanyaNeural","Ananya — Female"),"aarti":("hi-IN-AartiNeural","Aarti — Female"),"kunal":("hi-IN-KunalNeural","Kunal — Male")}
STYLES=["neutral","serious","excited","happy","sad","soft"]
app=FastAPI(title="AI Voice Studio"); app.mount("/static",StaticFiles(directory="static"),name="static")
class Req(BaseModel):
    text:str=Field(min_length=1,max_length=12000); voice:str="arjun"; style:str="neutral"; rate:int=Field(0,ge=-30,le=30); pitch:int=Field(0,ge=-20,le=20); volume:int=Field(0,ge=-20,le=20)
@app.get("/")
def home(): return FileResponse("static/index.html")
@app.get("/api/config")
def config(): return {"voices":{k:{"name":v[0],"label":v[1]} for k,v in VOICES.items()},"styles":STYLES}
@app.post("/api/tts")
def tts(x:Req):
    if not KEY: raise HTTPException(500,"Azure key .env में सेट नहीं है।")
    if x.voice not in VOICES or x.style not in STYLES: raise HTTPException(400,"Invalid voice/style")
    rate=x.rate
    if x.style=="soft": rate=max(-30,rate-5)
    elif x.style=="excited": rate=min(30,rate+6)
    elif x.style=="happy": rate=min(30,rate+3)
    elif x.style=="sad": rate=max(-30,rate-5)
    elif x.style=="serious": rate=max(-30,rate-2)
    ssml='<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN"><voice name="'+VOICES[x.voice][0]+'"><prosody rate="'+str(rate)+'%" pitch="'+str(x.pitch)+'%" volume="'+str(x.volume)+'%">'+html.escape(x.text)+'</prosody></voice></speak>'
    url=f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers={"Ocp-Apim-Subscription-Key":KEY,"Content-Type":"application/ssml+xml","X-Microsoft-OutputFormat":"audio-24khz-160kbitrate-mono-mp3","User-Agent":"AI-Voice-Studio"}
    try: r=requests.post(url,headers=headers,data=ssml.encode("utf-8"),timeout=60)
    except requests.RequestException as e: raise HTTPException(502,str(e))
    if r.status_code!=200: raise HTTPException(r.status_code,"Azure TTS error: "+r.text[:800])
    return JSONResponse({"audio_base64":base64.b64encode(r.content).decode(),"mime":"audio/mpeg"})
