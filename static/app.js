const $ = id => document.getElementById(id);

/* =========================
   V3 PRESETS
========================= */

const PRESETS = {
  custom: {
    style: "neutral",
    rate: 0,
    pitch: 0
  },

  viral_fact: {
    style: "excited",
    rate: 5,
    pitch: 1
  },

  news: {
    style: "serious",
    rate: -2,
    pitch: -1
  },

  mystery: {
    style: "serious",
    rate: -7,
    pitch: -2
  },

  story: {
    style: "soft",
    rate: -3,
    pitch: 0
  },

  education: {
    style: "neutral",
    rate: -1,
    pitch: 0
  },

  emotional: {
    style: "sad",
    rate: -7,
    pitch: -2
  },

  motivation: {
    style: "excited",
    rate: 3,
    pitch: 1
  },

  funny: {
    style: "happy",
    rate: 3,
    pitch: 1
  }
};


/* =========================
   STATE
========================= */

let rateValue = 0;
let pitchValue = 0;
let volumeValue = 0;
let boostValue = 0;

let currentAudioUrl = null;


/* =========================
   STATUS
========================= */

function setStatus(message, className = "") {

  const el = $("status");

  if (!el) return;

  el.textContent = message;
  el.className = className;
}


/* =========================
   SIDEBAR
========================= */

function openSidebar() {

  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");

  if (sidebar) {
    sidebar.classList.add("open");
  }

  if (overlay) {
    overlay.classList.add("show");
  }
}


function closeSidebar() {

  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.remove("show");
  }
}


const menuBtn = document.querySelector(".menu-btn");

if (menuBtn) {
  menuBtn.onclick = openSidebar;
}


const closeBtn = document.querySelector(".close-sidebar");

if (closeBtn) {
  closeBtn.onclick = closeSidebar;
}


const overlay = document.querySelector(".overlay");

if (overlay) {
  overlay.onclick = closeSidebar;
}


/* =========================
   NAVIGATION
========================= */

document.querySelectorAll(".nav button").forEach(button => {

  button.addEventListener("click", () => {

    document.querySelectorAll(".nav button")
      .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    closeSidebar();

  });

});


/* =========================
   SCRIPT COUNTER
========================= */

const textBox = $("text");

if (textBox) {

  textBox.addEventListener("input", () => {

    const count = $("count");

    if (count) {
      count.textContent =
        textBox.value.length + " / 12000";
    }

  });

}


/* =========================
   CLEAR SCRIPT
========================= */

const clearBtn = $("clear");

if (clearBtn) {

  clearBtn.onclick = () => {

    if (textBox) {
      textBox.value = "";
    }

    const count = $("count");

    if (count) {
      count.textContent = "0 / 12000";
    }

    const out = $("out");

    if (out) {
      out.classList.add("hidden");
    }

    setStatus("");

  };

}


/* =========================
   PRESET
========================= */

function applyPreset() {

  const presetElement = $("preset");

  if (!presetElement) return;

  const preset = PRESETS[presetElement.value];

  if (!preset) return;


  const style = $("style");

  if (style) {
    style.value = preset.style;
  }


  rateValue = preset.rate;
  pitchValue = preset.pitch;


  updateVoiceControls();

}


const presetElement = $("preset");

if (presetElement) {

  presetElement.addEventListener(
    "change",
    applyPreset
  );

}


/* =========================
   VALUE CONTROLS
========================= */

function updateVoiceControls() {

  const rateDisplay = $("rate_value");
  const pitchDisplay = $("pitch_value");
  const volumeDisplay = $("volume_value");

  if (rateDisplay) {
    rateDisplay.textContent =
      (rateValue > 0 ? "+" : "") +
      rateValue +
      "%";
  }

  if (pitchDisplay) {
    pitchDisplay.textContent =
      (pitchValue > 0 ? "+" : "") +
      pitchValue +
      "%";
  }

  if (volumeDisplay) {
    volumeDisplay.textContent =
      (volumeValue > 0 ? "+" : "") +
      volumeValue +
      "%";
  }

}


/* =========================
   RATE
========================= */

const rateMinus = $("rate_minus");
const ratePlus = $("rate_plus");

if (rateMinus) {

  rateMinus.onclick = () => {

    rateValue = Math.max(
      -30,
      rateValue - 1
    );

    updateVoiceControls();

  };

}


if (ratePlus) {

  ratePlus.onclick = () => {

    rateValue = Math.min(
      30,
      rateValue + 1
    );

    updateVoiceControls();

  };

}


/* =========================
   PITCH
========================= */

const pitchMinus = $("pitch_minus");
const pitchPlus = $("pitch_plus");

if (pitchMinus) {

  pitchMinus.onclick = () => {

    pitchValue = Math.max(
      -20,
      pitchValue - 1
    );

    updateVoiceControls();

  };

}


if (pitchPlus) {

  pitchPlus.onclick = () => {

    pitchValue = Math.min(
      20,
      pitchValue + 1
    );

    updateVoiceControls();

  };

}


/* =========================
   VOLUME
========================= */

const volumeMinus = $("volume_minus");
const volumePlus = $("volume_plus");

if (volumeMinus) {

  volumeMinus.onclick = () => {

    volumeValue = Math.max(
      -20,
      volumeValue - 1
    );

    updateVoiceControls();

  };

}


if (volumePlus) {

  volumePlus.onclick = () => {

    volumeValue = Math.min(
      20,
      volumeValue + 1
    );

    updateVoiceControls();

  };

}


/* =========================
   VOICE BOOST
========================= */

document.querySelectorAll(".boost-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      document.querySelectorAll(".boost-btn")
        .forEach(btn =>
          btn.classList.remove("active")
        );

      button.classList.add("active");

      boostValue =
        Number(button.dataset.boost || 0);

      volumeValue = boostValue;

      updateVoiceControls();

    });

  });


/* =========================
   ADVANCED CONTROLS
========================= */

const advancedBtn =
  document.getElementById("advanced_toggle");

const advanced =
  document.getElementById("advanced_controls");

if (advancedBtn && advanced) {

  advancedBtn.onclick = () => {

    advanced.classList.toggle("hidden");

  };

}


/* =========================
   USAGE
========================= */

let usage = {
  todayCharacters: 0,
  todayGenerations: 0
};


function updateUsageUI() {

  const usageMini =
    document.querySelector(".usage-mini");

  if (usageMini) {

    usageMini.textContent =
      "📊 Usage " +
      usage.todayCharacters;

  }

  const used =
    document.getElementById("usage_used");

  const generations =
    document.getElementById("usage_generations");

  if (used) {
    used.textContent =
      usage.todayCharacters +
      " characters";
  }

  if (generations) {
    generations.textContent =
      usage.todayGenerations;
  }

}


function loadUsage() {

  try {

    const saved =
      localStorage.getItem(
        "ai_voice_v3_usage"
      );

    if (saved) {

      usage = JSON.parse(saved);

    }

  } catch (error) {

    console.log(
      "Usage load error",
      error
    );

  }

  updateUsageUI();

}


function saveUsage() {

  try {

    localStorage.setItem(
      "ai_voice_v3_usage",
      JSON.stringify(usage)
    );

  } catch (error) {

    console.log(
      "Usage save error",
      error
    );

  }

}


/* =========================
   USAGE MODAL
========================= */

const usageMini =
  document.querySelector(".usage-mini");

const usageModal =
  document.getElementById("usage_modal");

const usageClose =
  document.getElementById("usage_close");


if (usageMini && usageModal) {

  usageMini.onclick = () => {

    usageModal.classList.add("show");

  };

}


if (usageClose && usageModal) {

  usageClose.onclick = () => {

    usageModal.classList.remove("show");

  };

}


if (usageModal) {

  usageModal.addEventListener(
    "click",
    event => {

      if (
        event.target === usageModal
      ) {

        usageModal.classList.remove(
          "show"
        );

      }

    }
  );

}


/* =========================
   VOICE PREVIEW
========================= */

document.querySelectorAll(
  ".voice-preview"
).forEach(button => {

  button.addEventListener(
    "click",
    async event => {

      event.stopPropagation();

      const voice =
        button.dataset.voice;

      if (!voice) return;

      setStatus(
        "⏳ Voice preview बनाई जा रही है...",
        "loading"
      );

      try {

        const response =
          await fetch("/api/tts", {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              text:
                "नमस्कार! यह AI Voice Studio की voice preview है।",

              voice: voice,

              style: "neutral",

              preset: "custom",

              rate: 0,

              pitch: 0,

              volume: 0,

              auto_director: false,

              auto_emotion: false,

              auto_pause: true,

              pronunciation: true

            })

          });


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Preview failed"
          );

        }


        const bytes =
          Uint8Array.from(
            atob(data.audio_base64),
            character =>
              character.charCodeAt(0)
          );


        const audioUrl =
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


        const audio =
          document.getElementById(
            "preview_audio"
          );


        if (audio) {

          audio.src = audioUrl;
          audio.play();

        }


        setStatus(
          "▶️ Voice preview तैयार है।",
          "success"
        );


      } catch (error) {

        setStatus(
          "❌ " + error.message,
          "error"
        );

      }

    }
  );

});


/* =========================
   VOICE SELECTION
========================= */

document.querySelectorAll(
  ".voice-card"
).forEach(card => {

  card.addEventListener(
    "click",
    () => {

      document.querySelectorAll(
        ".voice-card"
      ).forEach(item =>
        item.classList.remove(
          "selected"
        )
      );

      card.classList.add(
        "selected"
      );

      const voice =
        card.dataset.voice;

      const voiceSelect =
        $("voice");

      if (
        voiceSelect &&
        voice
      ) {

        voiceSelect.value =
          voice;

      }

    }
  );

});


/* =========================
   LOAD CONFIG
========================= */

async function loadConfig() {

  try {

    const response =
      await fetch(
        "/api/config?version=pro-v3"
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Config failed"
      );

    }


    const voiceSelect =
      $("voice");


    if (
      voiceSelect &&
      data.voices
    ) {

      voiceSelect.innerHTML =

        Object.entries(
          data.voices
        )

        .map(
          ([key, voice]) =>
            `<option value="${key}">
              ${voice.label}
            </option>`
        )

        .join("");

    }


    const styleSelect =
      $("style");


    if (
      styleSelect &&
      data.styles
    ) {

      styleSelect.innerHTML =

        data.styles

          .map(
            style =>
              `<option value="${style}">
                ${style}
              </option>`
          )

          .join("");

    }


    applyPreset();


  } catch (error) {

    setStatus(
      "❌ " + error.message,
      "error"
    );

  }

}


/* =========================
   GENERATE FULL VOICE
========================= */

const generate =
  $("generate");


if (generate) {

  generate.onclick =
    async () => {

      const text =
        textBox ?
        textBox.value.trim() :
        "";


      if (!text) {

        setStatus(
          "⚠️ पहले script लिखें।",
          "error"
        );

        return;

      }


      if (text.length > 12000) {

        setStatus(
          "⚠️ Script 12000 characters से ज्यादा है।",
          "error"
        );

        return;

      }


      generate.disabled = true;


      setStatus(
        "⏳ Professional voice बनाई जा रही है...",
        "loading"
      );


      try {

        const response =
          await fetch(
            "/api/tts",
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({

                text: text,

                voice:
                  $("voice") ?
                  $("voice").value :
                  "arjun",

                style:
                  $("style") ?
                  $("style").value :
                  "neutral",

                preset:
                  $("preset") ?
                  $("preset").value :
                  "custom",

                rate:
                  rateValue,

                pitch:
                  pitchValue,

                volume:
                  volumeValue,

                auto_director:
                  $("auto_director") ?
                  $("auto_director").checked :
                  true,

                auto_emotion:
                  $("auto_emotion") ?
                  $("auto_emotion").checked :
                  true,

                auto_pause:
                  $("auto_pause") ?
                  $("auto_pause").checked :
                  true,

                pronunciation:
                  $("pronunciation") ?
                  $("pronunciation").checked :
                  true

              })

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Voice generation failed"
          );

        }


        const bytes =
          Uint8Array.from(
            atob(data.audio_base64),
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


        const audio =
          $("audio");


        if (audio) {

          audio.src =
            currentAudioUrl;

        }


        const download =
          $("download");


        if (download) {

          download.href =
            currentAudioUrl;

        }


        const output =
          $("out");


        if (output) {

          output.classList.remove(
            "hidden"
          );

        }


        /* Usage */

        usage.todayCharacters +=
          text.length;

        usage.todayGenerations +=
          1;

        saveUsage();
        updateUsageUI();


        /* History */

        saveHistory(text);


        setStatus(
          "✅ PRO V3 Voice तैयार है!",
          "success"
        );


      } catch (error) {

        setStatus(
          "❌ " + error.message,
          "error"
        );

      } finally {

        generate.disabled =
          false;

      }

    };

}


/* =========================
   HISTORY
========================= */

function saveHistory(text) {

  try {

    let history =
      JSON.parse(
        localStorage.getItem(
          "ai_voice_v3_history"
        ) || "[]"
      );


    history.unshift({

      text:
        text.substring(0, 80),

      characters:
        text.length,

      time:
        new Date().toLocaleString(
          "hi-IN"
        )

    });


    history =
      history.slice(0, 20);


    localStorage.setItem(
      "ai_voice_v3_history",
      JSON.stringify(history)
    );


  } catch (error) {

    console.log(
      "History error",
      error
    );

  }

}


/* =========================
   INITIALIZE
========================= */

updateVoiceControls();

loadUsage();

loadConfig();
