const $ = id => document.getElementById(id);


/* =========================
   PRESETS
========================= */

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


/* =========================
   STATE
========================= */

let rateValue = 0;
let pitchValue = 0;
let volumeValue = 0;

let currentAudioUrl = null;


/* =========================
   STATUS
========================= */

function setStatus(message,className=""){

  const status = $("status");

  if(!status) return;

  status.textContent = message;
  status.className = className;

}


/* =========================
   SIDEBAR
========================= */

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


/* =========================
   SECTION SWITCHING
========================= */

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
    $("dashboard_section")?.classList.remove("hidden");
  }

  if(section==="voice"){
    $("voice_section")?.classList.remove("hidden");
  }

  if(section==="script"){
    $("script_section")?.classList.remove("hidden");
  }

  if(section==="history"){
    $("history_section")?.classList.remove("hidden");
    renderHistory();
  }

  if(section==="settings"){
    $("settings_section")?.classList.remove("hidden");
  }


  document.querySelectorAll(
    ".nav button"
  ).forEach(button=>{

    button.classList.toggle(
      "active",
      button.dataset.section===section
    );

  });

}


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


$("history_nav")?.addEventListener(
  "click",
  ()=>{

    showSection("history");
    closeSidebar();

  }
);


$("usage_nav")?.addEventListener(
  "click",
  ()=>{

    openUsage();
    closeSidebar();

  }
);


$("settings_nav")?.addEventListener(
  "click",
  ()=>{

    showSection("settings");
    closeSidebar();

  }
);


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


/* =========================
   SCRIPT COUNTER
========================= */

$("text")?.addEventListener(
  "input",
  ()=>{

    $("count").textContent =
      $("text").value.length +
      " / 12000";

  }
);


/* =========================
   CLEAR
========================= */

$("clear")?.addEventListener(
  "click",
  ()=>{

    $("text").value = "";

    $("count").textContent =
      "0 / 12000";

    $("out")?.classList.add(
      "hidden"
    );

    setStatus("");

  }
);


/* =========================
   PRESET
========================= */

function applyPreset(){

  const presetName =
    $("preset")?.value || "custom";

  const preset =
    PRESETS[presetName];

  if(!preset) return;


  if($("style")){
    $("style").value =
      preset.style;
  }


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


/* =========================
   VALUE CONTROLS
========================= */

function updateControls(){

  if($("rate_value")){

    $("rate_value").textContent =
      (rateValue>0 ? "+" : "") +
      rateValue +
      "%";

  }


  if($("pitch_value")){

    $("pitch_value").textContent =
      (pitchValue>0 ? "+" : "") +
      pitchValue +
      "%";

  }


  if($("volume_value")){

    $("volume_value").textContent =
      (volumeValue>0 ? "+" : "") +
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
        rateValue-1
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
        rateValue+1
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
        pitchValue-1
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
        pitchValue+1
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
        volumeValue-1
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
        volumeValue+1
      );

    updateControls();

  }
);


/* =========================
   VOICE BOOST
========================= */

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


/* =========================
   ADVANCED
========================= */

$("advanced_toggle")?.addEventListener(
  "click",
  ()=>{

    $("advanced_controls")
      ?.classList.toggle(
        "hidden"
      );

  }
);


/* =========================
   USAGE
========================= */

const USAGE_LIMIT = 10000;

let usage = {

  todayCharacters:0,

  todayGenerations:0,

  lastGeneration:""

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
    usage.todayCharacters;


  const percent =
    Math.min(
      100,
      Math.round(
        (used/USAGE_LIMIT)*100
      )
    );


  if($("usage_percent")){

    $("usage_percent").textContent =
      percent + "%";

  }


  if($("usage_summary")){

    $("usage_summary").textContent =
      used.toLocaleString("en-IN") +
      " characters used today";

  }


  if($("usage_used")){

    $("usage_used").textContent =
      used.toLocaleString("en-IN") +
      " characters";

  }


  if($("usage_remaining")){

    $("usage_remaining").textContent =
      Math.max(
        0,
        USAGE_LIMIT-used
      ).toLocaleString("en-IN") +
      " characters";

  }


  if($("usage_generations")){

    $("usage_generations").textContent =
      usage.todayGenerations;

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
      "📊 Usage " +
      percent +
      "%";

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


/* =========================
   VOICE LIBRARY
========================= */

function renderVoiceLibrary(
  voices
){

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
            ${voice.label}
          </b>

          <small>
            Hindi Neural Voice
          </small>

        </div>

        <button
          class="voice-preview"
          data-voice="${key}"
          type="button"
        >
          ▶
        </button>

      `;


      container.appendChild(
        card
      );


      card.addEventListener(
        "click",
        event=>{

          if(
            event.target.closest(
              ".voice-preview"
            )
          ){

            return;

          }


          selectVoice(key);

        }
      );

    }
  );


  document.querySelectorAll(
    ".voice-preview"
  ).forEach(button=>{

    button.addEventListener(
      "click",
      event=>{

        event.stopPropagation();

        previewVoice(
          button.dataset.voice
        );

      }
    );

  });

}


function selectVoice(
  voice
){

  if($("voice")){

    $("voice").value =
      voice;

  }


  document.querySelectorAll(
    ".voice-card"
  ).forEach(card=>{

    card.classList.toggle(
      "selected",
      card.dataset.voice===voice
    );

  });

}


/* =========================
   PREVIEW VOICE
========================= */

async function previewVoice(
  voice
){

  setStatus(
    "⏳ Voice preview बनाई जा रही है...",
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


    const bytes =
      Uint8Array.from(
        atob(
          data.audio_base64
        ),
        character =>
          character.charCodeAt(0)
      );


    const url =
      URL.createObjectURL(
        new Blob(
          [bytes],
          {
            type:
              data.mime ||
              "audio/mpeg"
          }
        )
      );


    if($("preview_audio")){

      $("preview_audio")
        .classList.remove(
          "hidden"
        );

      $("preview_audio").src =
        url;

      $("preview_audio").play();

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


/* =========================
   FULL GENERATE
========================= */

$("generate")?.addEventListener(
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


    if(text.length>12000){

      setStatus(
        "⚠️ Script 12000 characters से ज्यादा है।",
        "error"
      );

      return;

    }


    if(
      usage.todayCharacters +
      text.length >
      USAGE_LIMIT
    ){

      setStatus(
        "⚠️ App usage limit पूरी हो गई है।",
        "error"
      );

      return;

    }


    const generate =
      $("generate");


    generate.disabled =
      true;


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

              rate:rateValue,

              pitch:pitchValue,

              volume:volumeValue,

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


      const bytes =
        Uint8Array.from(
          atob(
            data.audio_base64
          ),
          character =>
            character.charCodeAt(0)
        );


      currentAudioUrl =
        URL.createObjectURL(

          new Blob(
            [bytes],
            {
              type:
                data.mime ||
                "audio/mpeg"
            }
          )

        );


      if($("audio")){

        $("audio").src =
          currentAudioUrl;

      }


      if($("download")){

        $("download").href =
          currentAudioUrl;

      }


      $("out")
        ?.classList.remove(
          "hidden"
        );


      /* USAGE */

      usage.todayCharacters +=
        text.length;


      usage.todayGenerations +=
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

      generate.disabled =
        false;

    }

  }
);


/* =========================
   QUICK PREVIEW
========================= */

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


async function generatePreviewFromScript(
  text
){

  setStatus(
    "⏳ Quick Preview बनाई जा रही है...",
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

            rate:rateValue,

            pitch:pitchValue,

            volume:volumeValue,

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


    const bytes =
      Uint8Array.from(
        atob(
          data.audio_base64
        ),
        character =>
          character.charCodeAt(0)
      );


    const url =
      URL.createObjectURL(

        new Blob(
          [bytes],
          {
            type:
              data.mime ||
              "audio/mpeg"
          }
        )

      );


    if($("preview_audio")){

      $("preview_audio")
        .classList.remove(
          "hidden"
        );

      $("preview_audio").src =
        url;

      $("preview_audio").play();

    }


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


/* =========================
   HISTORY
========================= */

function saveHistory(
  text
){

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

  const recent =
    $("recent_history");


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


  if(container){

    if(!history.length){

      container.innerHTML =
        `<p class="hint">
          अभी कोई history नहीं है।
        </p>`;

    }else{

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

  }


  if(recent){

    const latest =
      history.slice(
        0,
        3
      );


    if(!latest.length){

      recent.innerHTML =
        `<p class="hint">
          अभी कोई voice history नहीं है।
        </p>`;

    }else{

      recent.innerHTML =
        latest.map(
          item=>`

            <div class="history-item">

              <div>

                <b>
                  ${escapeHTML(item.text)}
                </b>

                <small>
                  ${item.characters} characters
                </small>

              </div>

            </div>

          `
        ).join("");

    }

  }

}


function escapeHTML(
  value
){

  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


/* =========================
   AI SCRIPT PLACEHOLDER
========================= */

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


    /*
      AI Script Generator का backend
      अभी अलग endpoint नहीं है।

      इसलिए फिलहाल यह बताता है कि
      feature बाद में backend से जुड़ेगा।
    */

    setStatus(
      "ℹ️ AI Script Generator को backend AI service से जोड़ना बाकी है।",
      "loading"
    );

  }
);


/* =========================
   CLEAN SCRIPT
========================= */

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


    /*
      Basic local cleaning.
      यह external AI service नहीं है।
    */

    let cleaned =
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


    $("script_output").value =
      cleaned;


    $("script_result")
      ?.classList.remove(
        "hidden"
      );

  }
);


/* =========================
   USE SCRIPT
========================= */

$("use_script")?.addEventListener(
  "click",
  ()=>{

    const output =
      $("script_output")
        ?.value.trim();


    if(!output) return;


    $("text").value =
      output;


    $("count").textContent =
      output.length +
      " / 12000";


    showSection(
      "voice"
    );

  }
);


/* =========================
   INITIALIZE
========================= */

updateControls();

loadUsage();

renderHistory();

loadConfig();


/* =========================
   CONFIG
========================= */

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
              ${voice.label}
            </option>`
        )
        .join("");


      renderVoiceLibrary(
        data.voices
      );


      selectVoice(
        Object.keys(
          data.voices
        )[0] || "arjun"
      );

    }


    if(
      $("style") &&
      data.styles
    ){

      $("style").innerHTML =
        data.styles
          .map(
            style=>
              `<option value="${style}">
                ${style}
              </option>`
          )
          .join("");

    }


    applyPreset();


  }catch(error){

    setStatus(
      "❌ " + error.message,
      "error"
    );

  }

}
