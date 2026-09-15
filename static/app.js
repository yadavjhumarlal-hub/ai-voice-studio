const $ = id => document.getElementById(id);


/* =========================================================
   PRESETS
========================================================= */

const PRESETS = {

  custom:{
    style:"neutral",
    rate:0,
    pitch:0
  },

  viral_fact:{
    style:"excited",
    rate:5,
    pitch:1
  },

  news:{
    style:"serious",
    rate:-2,
    pitch:-1
  },

  mystery:{
    style:"serious",
    rate:-7,
    pitch:-2
  },

  story:{
    style:"soft",
    rate:-3,
    pitch:0
  },

  education:{
    style:"neutral",
    rate:-1,
    pitch:0
  },

  emotional:{
    style:"sad",
    rate:-7,
    pitch:-2
  },

  motivation:{
    style:"excited",
    rate:3,
    pitch:1
  },

  funny:{
    style:"happy",
    rate:3,
    pitch:1
  }

};


/* =========================================================
   STATE
========================================================= */

let rateValue = 0;
let pitchValue = 0;
let volumeValue = 0;

let currentAudioUrl = null;


/* =========================================================
   STATUS
========================================================= */

function setStatus(message,className=""){

  const status = $("status");

  if(!status) return;

  status.textContent = message;
  status.className = className;

}


/* =========================================================
   SIDEBAR
========================================================= */

function openSidebar(){

  $("sidebar")?.classList.add("open");
  $("overlay")?.classList.add("show");

}


function closeSidebar(){

  $("sidebar")?.classList.remove("open");
  $("overlay")?.classList.remove("show");

}


$("menu_btn")?.addEventListener(
  "click",
  openSidebar
);


$("close_sidebar")?.addEventListener(
  "click",
  closeSidebar
);


$("overlay")?.addEventListener(
  "click",
  closeSidebar
);


/* =========================================================
   SECTION SWITCHING
========================================================= */

function showSection(section){

  const sections = [

    "dashboard_section",
    "voice_section",
    "script_section",
    "history_section",
    "settings_section"

  ];


  sections.forEach(id=>{

    $(id)?.classList.add("hidden");

  });


  if(section==="dashboard"){

    $("dashboard_section")
      ?.classList.remove("hidden");

  }


  if(section==="voice"){

    $("voice_section")
      ?.classList.remove("hidden");

  }


  if(section==="script"){

    $("script_section")
      ?.classList.remove("hidden");

  }


  if(section==="history"){

    $("history_section")
      ?.classList.remove("hidden");

    renderHistory();

  }


  if(section==="settings"){

    $("settings_section")
      ?.classList.remove("hidden");

    fillSettingsForm();

  }


  document.querySelectorAll(
    ".nav button"
  ).forEach(button=>{

    button.classList.toggle(

      "active",

      button.dataset.section === section

    );

  });

}


/* NAV BUTTONS */

document.querySelectorAll(
  ".nav button[data-section]"
).forEach(button=>{

  button.addEventListener(
    "click",
    ()=>{

      showSection(
        button.dataset.section
      );

      closeSidebar();

    }
  );

});


/* HISTORY */

$("history_nav")?.addEventListener(
  "click",
  ()=>{

    showSection("history");

    closeSidebar();

  }
);


/* USAGE */

$("usage_nav")?.addEventListener(
  "click",
  ()=>{

    openUsage();

    closeSidebar();

  }
);


/* SETTINGS */

$("settings_nav")?.addEventListener(
  "click",
  ()=>{

    showSection("settings");

    closeSidebar();

  }
);


/* DASHBOARD CARDS */

document.querySelectorAll(
  "[data-open]"
).forEach(card=>{

  card.addEventListener(
    "click",
    ()=>{

      showSection(
        card.dataset.open
      );

    }
  );

});


/* =========================================================
   SCRIPT COUNTER
========================================================= */

$("text")?.addEventListener(
  "input",
  ()=>{

    const value =
      $("text").value.length;

    if($("count")){

      $("count").textContent =
        value + " / 12000";

    }

  }
);


/* =========================================================
   CLEAR
========================================================= */

$("clear")?.addEventListener(
  "click",
  ()=>{

    if($("text")){

      $("text").value = "";

    }


    if($("count")){

      $("count").textContent =
        "0 / 12000";

    }


    $("out")
      ?.classList.add("hidden");


    setStatus("");

  }
);


/* =========================================================
   PRESET
========================================================= */

function applyPreset(){

  const presetName =
    $("preset")?.value || "custom";

  const preset =
    PRESETS[presetName];

  if(!preset) return;


  rateValue =
    preset.rate;

  pitchValue =
    preset.pitch;


  updateControls();

}


$("preset")?.addEventListener(
  "change",
  applyPreset
);


/* =========================================================
   VOICE CONTROLS
========================================================= */

function updateControls(){

  if($("rate_value")){

    $("rate_value").textContent =
      (rateValue > 0 ? "+" : "") +
      rateValue +
      "%";

  }


  if($("pitch_value")){

    $("pitch_value").textContent =
      (pitchValue > 0 ? "+" : "") +
      pitchValue +
      "%";

  }


  if($("volume_value")){

    $("volume_value").textContent =
      (volumeValue > 0 ? "+" : "") +
      volumeValue +
      "%";

  }

}


/* SPEED */

$("rate_minus")?.addEventListener(
  "click",
  ()=>{

    rateValue =
      Math.max(
        -30,
        rateValue - 1
      );

    updateControls();

  }
);


$("rate_plus")?.addEventListener(
  "click",
  ()=>{

    rateValue =
      Math.min(
        30,
        rateValue + 1
      );

    updateControls();

  }
);


/* PITCH */

$("pitch_minus")?.addEventListener(
  "click",
  ()=>{

    pitchValue =
      Math.max(
        -20,
        pitchValue - 1
      );

    updateControls();

  }
);


$("pitch_plus")?.addEventListener(
  "click",
  ()=>{

    pitchValue =
      Math.min(
        20,
        pitchValue + 1
      );

    updateControls();

  }
);


/* VOLUME */

$("volume_minus")?.addEventListener(
  "click",
  ()=>{

    volumeValue =
      Math.max(
        -20,
        volumeValue - 1
      );

    updateControls();

  }
);


$("volume_plus")?.addEventListener(
  "click",
  ()=>{

    volumeValue =
      Math.min(
        20,
        volumeValue + 1
      );

    updateControls();

  }
);


/* =========================================================
   VOICE BOOST
========================================================= */

document.querySelectorAll(
  ".boost-btn"
).forEach(button=>{

  button.addEventListener(
    "click",
    ()=>{

      document.querySelectorAll(
        ".boost-btn"
      ).forEach(btn=>{

        btn.classList.remove(
          "active"
        );

      });


      button.classList.add(
        "active"
      );


      volumeValue =
        Number(
          button.dataset.boost || 0
        );


      updateControls();

    }
  );

});


/* =========================================================
   ADVANCED
========================================================= */

$("advanced_toggle")?.addEventListener(
  "click",
  ()=>{

    $("advanced_controls")
      ?.classList.toggle(
        "hidden"
      );

  }
);


/* =========================================================
   USAGE
========================================================= */

const USAGE_LIMIT = 450000;

function getCurrentMonth(){

  const now = new Date();

  return (
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2,"0")
  );

}


let usage = {

  month: getCurrentMonth(),

  monthCharacters: 0,

  monthGenerations: 0,

  lastGeneration: ""

};

function loadUsage(){

  try{

    const saved =
      localStorage.getItem(
        "ai_voice_v3_usage"
      );


    if(saved){

      const parsed =
        JSON.parse(saved);


      if(
        parsed &&
        typeof parsed === "object"
      ){

        usage = {

          ...usage,

          ...parsed

        };

      }

    }


    /* नया महीना शुरू होने पर reset */

    const currentMonth =
      getCurrentMonth();


    if(
      usage.month !== currentMonth
    ){

      usage = {

        month: currentMonth,

        monthCharacters: 0,

        monthGenerations: 0,

        lastGeneration: ""

      };


      saveUsage();

    }

  }catch(error){

    console.log(
      "Usage load error",
      error
    );

  }


  updateUsage();

}


function saveUsage(){

  try{

    localStorage.setItem(

      "ai_voice_v3_usage",

      JSON.stringify(usage)

    );

  }catch(error){

    console.log(
      "Usage save error",
      error
    );

  }

}


function updateUsage(){

  const used =
    Number(
      usage.monthCharacters || 0
    );


  const percent =
    Math.min(

      100,

      Math.round(
        (used / USAGE_LIMIT) * 100
      )

    );


  const remaining =
    Math.max(
      0,
      USAGE_LIMIT - used
    );


  if($("usage_percent")){

    $("usage_percent").textContent =
      percent + "%";

  }


  if($("usage_summary")){

    $("usage_summary").textContent =

      used.toLocaleString("en-IN") +

      " / 4,50,000 characters this month";

  }


  if($("usage_used")){

    $("usage_used").textContent =

      used.toLocaleString("en-IN") +

      " / 4,50,000 characters";

  }


  if($("usage_remaining")){

    $("usage_remaining").textContent =

      remaining.toLocaleString("en-IN") +

      " characters remaining";

  }


  if($("usage_generations")){

    $("usage_generations").textContent =

      usage.monthGenerations || 0;

  }


  if($("usage_last")){

    $("usage_last").textContent =

      usage.lastGeneration ||

      "अभी कोई generation नहीं";

  }


  if($("usage_fill")){

    $("usage_fill").style.width =
      percent + "%";

  }


  if($("usage_mini")){

    $("usage_mini").textContent =
      "📊 Usage " + percent + "%";

  }

}


function openUsage(){

  $("usage_modal")
    ?.classList.add("show");

}


$("usage_mini")?.addEventListener(
  "click",
  openUsage
);


$("usage_card")?.addEventListener(
  "click",
  openUsage
);


$("usage_close")?.addEventListener(
  "click",
  ()=>{

    $("usage_modal")
      ?.classList.remove("show");

  }
);


$("usage_modal")?.addEventListener(
  "click",
  event=>{

    if(
      event.target ===
      $("usage_modal")
    ){

      $("usage_modal")
        .classList.remove("show");

    }

  }
);


/* =========================================================
   VOICE LIBRARY
========================================================= */

function renderVoiceLibrary(voices){

  const container =
    $("voice_library");

  if(!container) return;


  container.innerHTML = "";


  Object.entries(
    voices
  ).forEach(
    ([key,voice])=>{

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "voice-card";


      card.dataset.voice =
        key;


      const icon =
        voice.label.includes(
          "Female"
        )
        ? "👩"
        : "👨";


      card.innerHTML = `

        <div class="voice-avatar">
          ${icon}
        </div>

        <div class="voice-info">

          <b>
            ${escapeHTML(voice.label)}
          </b>

          <small>
            Hindi Neural Voice
          </small>

        </div>

      `;


      container.appendChild(
        card
      );


      card.addEventListener(
        "click",
        ()=>{
          selectVoice(key);
        }
      );

    }
  );

}


/* SELECT VOICE */

function selectVoice(voice){

  if($("voice")){

    $("voice").value =
      voice;

  }


  document.querySelectorAll(
    ".voice-card"
  ).forEach(card=>{

    card.classList.toggle(

      "selected",

      card.dataset.voice === voice

    );

  });

}


/* =========================================================
   VOICE PREVIEW
========================================================= */

async function previewVoice(voice){

  setStatus(

    "⏳ Voice preview बनाई जा रही है...",

    "loading"

  );


  try{

    const response =
      await fetch(
        "/api/preview",
        {

          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({

            text:
              "नमस्कार! यह AI Voice Studio की voice preview है।",

            voice:voice,

            style:"neutral",

            preset:"custom",

            rate:0,

            pitch:0,

            volume:0,

            auto_director:false,

            auto_emotion:false,

            auto_pause:true,

            pronunciation:true

          })

        }
      );


    const data =
      await response.json();


    if(!response.ok){

      throw new Error(

        data.detail ||
        "Preview failed"

      );

    }


    const audioUrl =
      base64ToBlobUrl(
        data.audio_base64,
        data.mime || "audio/mpeg"
      );


    if($("preview_audio")){

      $("preview_audio")
        .classList.remove("hidden");

      $("preview_audio").src =
        audioUrl;

      $("preview_audio").play()
        .catch(()=>{});

    }


    setStatus(

      "▶️ Voice preview तैयार है।",

      "success"

    );


  }catch(error){

    setStatus(

      "❌ " + error.message,

      "error"

    );

  }

}


/* SELECTED VOICE PREVIEW */

$("selected_voice_preview")?.addEventListener(
  "click",
  ()=>{

    const voice =
      $("voice")?.value ||
      "arjun";


    previewVoice(
      voice
    );

  }
);


/* =========================================================
   BASE64 AUDIO
========================================================= */

function base64ToBlobUrl(
  base64,
  mime
){

  const bytes =
    Uint8Array.from(

      atob(base64),

      character =>
        character.charCodeAt(0)

    );


  return URL.createObjectURL(

    new Blob(
      [bytes],
      {
        type:mime
      }
    )

  );

}


/* =========================================================
   FULL GENERATE
========================================================= */

$("generate")?.addEventListener(
  "click",
  generateVoice
);


async function generateVoice(){

  const text =
    $("text")?.value.trim() ||
    "";


  if(!text){

    setStatus(

      "⚠️ पहले script लिखें।",

      "error"

    );

    return;

  }


  if(text.length > 12000){

    setStatus(

      "⚠️ Script 12000 characters से ज्यादा है।",

      "error"

    );

    return;

  }


 if(

  usage.monthCharacters +
  text.length >
  USAGE_LIMIT

){
    setStatus(

      "⚠️ App usage limit पूरी हो गई है।",

      "error"

    );

    return;

  }


  const button =
    $("generate");


  if(button){

    button.disabled =
      true;

  }


  setStatus(

    "⏳ Professional voice बनाई जा रही है...",

    "loading"

  );


  try{

    const response =
      await fetch(

        "/api/tts",

        {

          method:"POST",

          headers:{

            "Content-Type":
              "application/json"

          },

          body:JSON.stringify({

            text:text,

            voice:
              $("voice")?.value ||
              "arjun",

            style:
              $("style")?.value ||
              "neutral",

            preset:
              $("preset")?.value ||
              "custom",

            rate:
              rateValue,

            pitch:
              pitchValue,

            volume:
              volumeValue,

            auto_director:
              $("auto_director")?.checked ??
              true,

            auto_emotion:
              $("auto_emotion")?.checked ??
              true,

            auto_pause:
              $("auto_pause")?.checked ??
              true,

            pronunciation:
              $("pronunciation")?.checked ??
              true

          })

        }

      );


    const data =
      await response.json();


    if(!response.ok){

      throw new Error(

        data.detail ||
        "Voice generation failed"

      );

    }


    if(currentAudioUrl){

      URL.revokeObjectURL(
        currentAudioUrl
      );

    }


    currentAudioUrl =
      base64ToBlobUrl(

        data.audio_base64,

        data.mime ||
        "audio/mpeg"

      );


    if($("audio")){

      $("audio").src =
        currentAudioUrl;

    }


    if($("download")){

      $("download").href =
        currentAudioUrl;

      $("download").download =
        "ai-voice-pro-v3.mp3";

    }


    $("out")
      ?.classList.remove("hidden");


    /* USAGE */

    const actualCharacters =
      Number(
        data.characters ||
        text.length
      );


    usage.monthCharacters +=
  actualCharacters;

usage.monthGenerations +=
  1;


    usage.lastGeneration =
      new Date().toLocaleString(
        "hi-IN"
      );


    saveUsage();

    updateUsage();


    /* HISTORY */

    saveHistory(text);


    setStatus(

      "✅ PRO V3 Voice तैयार है!",

      "success"

    );


  }catch(error){

    setStatus(

      "❌ " + error.message,

      "error"

    );

  }finally{

    if(button){

      button.disabled =
        false;

    }

  }

}


/* =========================================================
   QUICK PREVIEW
========================================================= */

$("preview")?.addEventListener(
  "click",
  async ()=>{

    const text =
      $("text")?.value.trim() ||
      "";


    if(!text){

      setStatus(

        "⚠️ पहले script लिखें।",

        "error"

      );

      return;

    }


    const previewText =

      text
        .split(/[।!?]/)
        .filter(Boolean)
        .slice(0,2)
        .join("।");


    await generatePreviewFromScript(
      previewText
    );

  }
);


async function generatePreviewFromScript(text){

   const previewCharacters =
  Number(
    data.characters ||
    text.length
  );


usage.monthCharacters +=
  previewCharacters;


usage.monthGenerations +=
  1;


usage.lastGeneration =
  new Date().toLocaleString(
    "hi-IN"
  );


saveUsage();

updateUsage();
   
  setStatus(

    "⏳ Quick Preview बनाई जा रही है...",

    "loading"

  );


  try{

    const response =
      await fetch(

        "/api/preview",

        {

          method:"POST",

          headers:{

            "Content-Type":
              "application/json"

          },

          body:JSON.stringify({

            text:text,

            voice:
              $("voice")?.value ||
              "arjun",

            style:
              $("style")?.value ||
              "neutral",

            preset:
              $("preset")?.value ||
              "custom",

            rate:
              rateValue,

            pitch:
              pitchValue,

            volume:
              volumeValue,

            auto_director:
              $("auto_director")?.checked ??
              true,

            auto_emotion:
              $("auto_emotion")?.checked ??
              true,

            auto_pause:
              $("auto_pause")?.checked ??
              true,

            pronunciation:
              $("pronunciation")?.checked ??
              true

          })

        }

      );


    const data =
      await response.json();


    if(!response.ok){

      throw new Error(

        data.detail ||
        "Preview failed"

      );

    }


    const url =
      base64ToBlobUrl(

        data.audio_base64,

        data.mime ||
        "audio/mpeg"

      );


    if($("preview_audio")){

      $("preview_audio")
        .classList.remove("hidden");

      $("preview_audio").src =
        url;

      $("preview_audio").play()
        .catch(()=>{});

    }

const previewCharacters =
  Number(
    data.characters ||
    0
  );


usage.monthCharacters +=
  previewCharacters;


usage.monthGenerations +=
  1;


usage.lastGeneration =
  new Date().toLocaleString(
    "hi-IN"
  );


saveUsage();

updateUsage();
     
    setStatus(

      "▶️ Quick Preview तैयार है।",

      "success"

    );


  }catch(error){

    setStatus(

      "❌ " + error.message,

      "error"

    );

  }

}


/* =========================================================
   HISTORY
========================================================= */

function saveHistory(text){

  try{

    let history =
      JSON.parse(

        localStorage.getItem(
          "ai_voice_v3_history"
        ) || "[]"

      );


    history.unshift({

      text:
        text.substring(
          0,
          80
        ),

      characters:
        text.length,

      time:
        new Date().toLocaleString(
          "hi-IN"
        )

    });


    history =
      history.slice(
        0,
        20
      );


    localStorage.setItem(

      "ai_voice_v3_history",

      JSON.stringify(history)

    );


    renderHistory();


  }catch(error){

    console.log(
      "History error",
      error
    );

  }

}


function renderHistory(){

  const container =
    $("history_list");


  let history = [];


  try{

    history =
      JSON.parse(

        localStorage.getItem(
          "ai_voice_v3_history"
        ) || "[]"

      );

  }catch(error){

    history = [];

  }


  if(!container) return;


  if(!history.length){

    container.innerHTML =

      `<p class="hint">
        अभी कोई history नहीं है।
      </p>`;

    return;

  }


  container.innerHTML =

    history.map(

      item=>`

        <div class="history-item">

          <div>

            <b>
              ${escapeHTML(item.text)}
            </b>

            <small>
              ${item.characters} characters •
              ${escapeHTML(item.time)}
            </small>

          </div>

        </div>

      `

    ).join("");

}


/* =========================================================
   SCRIPT TOOLS
========================================================= */

$("script_generate")?.addEventListener(
  "click",
  ()=>{

    const topic =
      $("script_topic")
        ?.value.trim();


    if(!topic){

      alert(
        "पहले topic लिखें।"
      );

      return;

    }


    setStatus(

      "ℹ️ AI Script Generator अभी backend AI से जुड़ा नहीं है।",

      "loading"

    );

  }
);


/* CLEAN SCRIPT */

$("clean_script")?.addEventListener(
  "click",
  ()=>{

    const text =
      $("clean_text")
        ?.value.trim();


    if(!text){

      alert(
        "पहले rough script डालें।"
      );

      return;

    }


    const cleaned =

      text

        .replace(

          /\b(हम्म|उम्म|मतलब|तो दोस्तों|दोस्तो)\b/gi,

          ""

        )

        .replace(
          /\s+/g,
          " "
        )

        .trim();


    if($("script_output")){

      $("script_output").value =
        cleaned;

    }


    $("script_result")
      ?.classList.remove(
        "hidden"
      );

  }
);


/* USE SCRIPT */

$("use_script")?.addEventListener(
  "click",
  ()=>{

    const output =
      $("script_output")
        ?.value.trim();


    if(!output) return;


    if($("text")){

      $("text").value =
        output;

    }


    if($("count")){

      $("count").textContent =
        output.length +
        " / 12000";

    }


    showSection(
      "voice"
    );

  }
);


/* =========================================================
   SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {

  voice:"arjun",

  preset:"custom",

  rate:0,

  pitch:0,

  volume:0,

  director:true,

  emotion:true,

  pause:true,

  pronunciation:true

};


let savedSettings = {

  ...DEFAULT_SETTINGS

};


/* LOAD SETTINGS */

function loadSettings(){

  try{

    const saved =
      localStorage.getItem(
        "ai_voice_v3_settings"
      );


    if(saved){

      const parsed =
        JSON.parse(saved);


      if(
        parsed &&
        typeof parsed === "object"
      ){

        savedSettings = {

          ...DEFAULT_SETTINGS,

          ...parsed

        };

      }

    }

  }catch(error){

    console.log(
      "Settings load error",
      error
    );

  }

}


/* FILL SETTINGS */

function fillSettingsForm(){

  if($("setting_voice")){

    $("setting_voice").value =
      savedSettings.voice;

  }


  if($("setting_preset")){

    $("setting_preset").value =
      savedSettings.preset;

  }


  if($("setting_rate")){

    $("setting_rate").value =
      savedSettings.rate;

  }


  if($("setting_pitch")){

    $("setting_pitch").value =
      savedSettings.pitch;

  }


  if($("setting_volume")){

    $("setting_volume").value =
      savedSettings.volume;

  }


  if($("setting_director")){

    $("setting_director").checked =
      savedSettings.director;

  }


  if($("setting_emotion")){

    $("setting_emotion").checked =
      savedSettings.emotion;

  }


  if($("setting_pause")){

    $("setting_pause").checked =
      savedSettings.pause;

  }


  if($("setting_pronunciation")){

    $("setting_pronunciation").checked =
      savedSettings.pronunciation;

  }

}


/* APPLY SETTINGS */

function applySavedSettings(){

  if($("voice")){

    selectVoice(
      savedSettings.voice
    );

  }


  if($("preset")){

    $("preset").value =
      savedSettings.preset;

  }


  rateValue =
    Number(
      savedSettings.rate
    );


  pitchValue =
    Number(
      savedSettings.pitch
    );


  volumeValue =
    Number(
      savedSettings.volume
    );


  if($("auto_director")){

    $("auto_director").checked =
      savedSettings.director;

  }


  if($("auto_emotion")){

    $("auto_emotion").checked =
      savedSettings.emotion;

  }


  if($("auto_pause")){

    $("auto_pause").checked =
      savedSettings.pause;

  }


  if($("pronunciation")){

    $("pronunciation").checked =
      savedSettings.pronunciation;

  }


  updateControls();


  /* Update boost selection */

  document.querySelectorAll(
    ".boost-btn"
  ).forEach(button=>{

    button.classList.toggle(

      "active",

      Number(
        button.dataset.boost || 0
      ) === volumeValue

    );

  });

}


/* SETTINGS VOICE LIST */

function populateSettingsVoiceList(
  voices
){

  const select =
    $("setting_voice");

  if(!select) return;


  select.innerHTML = "";


  Object.entries(
    voices
  ).forEach(
    ([key,voice])=>{

      const option =
        document.createElement(
          "option"
        );


      option.value =
        key;


      option.textContent =
        voice.label;


      select.appendChild(
        option
      );

    }
  );


  select.value =
    savedSettings.voice;

}


/* SAVE SETTINGS */

$("save_settings")?.addEventListener(
  "click",
  ()=>{

    savedSettings = {

      voice:
        $("setting_voice")?.value ||
        "arjun",

      preset:
        $("setting_preset")?.value ||
        "custom",

      rate:
        Number(
          $("setting_rate")?.value ||
          0
        ),

      pitch:
        Number(
          $("setting_pitch")?.value ||
          0
        ),

      volume:
        Number(
          $("setting_volume")?.value ||
          0
        ),

      director:
        $("setting_director")?.checked ??
        true,

      emotion:
        $("setting_emotion")?.checked ??
        true,

      pause:
        $("setting_pause")?.checked ??
        true,

      pronunciation:
        $("setting_pronunciation")?.checked ??
        true

    };


    try{

      localStorage.setItem(

        "ai_voice_v3_settings",

        JSON.stringify(
          savedSettings
        )

      );


      applySavedSettings();


      if($("settings_status")){

        $("settings_status").textContent =
          "✅ Settings save हो गईं।";


        setTimeout(
          ()=>{

            if($("settings_status")){

              $("settings_status").textContent =
                "";

            }

          },
          2500
        );

      }

    }catch(error){

      console.log(
        "Settings save error",
        error
      );

    }

  }
);


/* =========================================================
   CONFIG
========================================================= */

async function loadConfig(){

  try{

    const response =
      await fetch(
        "/api/config?version=pro-v3"
      );


    const data =
      await response.json();


    if(!response.ok){

      throw new Error(

        data.detail ||
        "Config failed"

      );

    }


    /* VOICE */

    if(
      $("voice") &&
      data.voices
    ){

      $("voice").innerHTML =

        Object.entries(
          data.voices
        )
        .map(

          ([key,voice])=>

            `<option value="${key}">
              ${escapeHTML(voice.label)}
            </option>`

        )
        .join("");


      renderVoiceLibrary(
        data.voices
      );


      populateSettingsVoiceList(
        data.voices
      );

    }


    /* STYLE */

    if(
      $("style") &&
      data.styles
    ){

      $("style").innerHTML =

        data.styles
          .map(

            style=>

              `<option value="${style}">
                ${escapeHTML(style)}
              </option>`

          )
          .join("");

    }


    /* APPLY SAVED SETTINGS */

    applySavedSettings();


  }catch(error){

    setStatus(

      "❌ " + error.message,

      "error"

    );

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value){

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

loadSettings();

updateControls();

loadUsage();

renderHistory();

loadConfig();
