"use strict";

/* =========================================================
   AI VOICE STUDIO PRO V3.1
   Azure Speech + Edge TTS
========================================================= */

const $ = id => document.getElementById(id);

const USAGE_LIMIT = 450000;

const DEFAULT_ENGINE = "edge";

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

const DEFAULT_SETTINGS = {
  engine: DEFAULT_ENGINE,
  voice: "arjun",
  preset: "custom",
  rate: 0,
  pitch: 0,
  volume: 0,
  director: true,
  emotion: true,
  pause: true,
  pronunciation: true
};

let rateValue = 0;
let pitchValue = 0;
let volumeValue = 0;

let currentAudioUrl = null;
let previewAudioUrl = null;

let currentVoices = {};
let azureVoices = {};
let edgeVoices = {};

let savedSettings = { ...DEFAULT_SETTINGS };

let isGenerating = false;


/* =========================================================
   STATUS
========================================================= */

function setStatus(message, className = "") {
  const status = $("status");

  if (!status) return;

  status.textContent = message;
  status.className = className;
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   SIDEBAR
========================================================= */

function openSidebar() {
  $("sidebar")?.classList.add("open");
  $("overlay")?.classList.add("show");
}

function closeSidebar() {
  $("sidebar")?.classList.remove("open");
  $("overlay")?.classList.remove("show");
}

$("menu_btn")?.addEventListener("click", openSidebar);
$("close_sidebar")?.addEventListener("click", closeSidebar);
$("overlay")?.addEventListener("click", closeSidebar);


/* =========================================================
   SECTION NAVIGATION
========================================================= */

function showSection(section) {
  const sections = [
    "dashboard_section",
    "voice_section",
    "script_section",
    "history_section",
    "settings_section"
  ];

  sections.forEach(id => {
    $(id)?.classList.add("hidden");
  });

  const sectionMap = {
    dashboard: "dashboard_section",
    voice: "voice_section",
    script: "script_section",
    history: "history_section",
    settings: "settings_section"
  };

  const target = sectionMap[section];

  if (target) {
    $(target)?.classList.remove("hidden");
  }

  if (section === "history") {
    renderHistory();
  }

  if (section === "settings") {
    fillSettingsForm();
  }

  document.querySelectorAll(".nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.section === section
    );
  });
}

document.querySelectorAll(".nav button[data-section]")
  .forEach(button => {
    button.addEventListener("click", () => {
      showSection(button.dataset.section);
      closeSidebar();
    });
  });

$("history_nav")?.addEventListener("click", () => {
  showSection("history");
  closeSidebar();
});

$("usage_nav")?.addEventListener("click", () => {
  openUsage();
  closeSidebar();
});

$("settings_nav")?.addEventListener("click", () => {
  showSection("settings");
  closeSidebar();
});

document.querySelectorAll("[data-open]").forEach(card => {
  card.addEventListener("click", () => {
    showSection(card.dataset.open);
  });
});


/* =========================================================
   SCRIPT COUNTER AND CLEAR
========================================================= */

$("text")?.addEventListener("input", () => {
  if ($("count")) {
    $("count").textContent =
      $("text").value.length + " / 12000";
  }
});

$("clear")?.addEventListener("click", () => {
  if ($("text")) $("text").value = "";

  if ($("count")) {
    $("count").textContent = "0 / 12000";
  }

  $("out")?.classList.add("hidden");

  setStatus("");
});


/* =========================================================
   PRESET AND CONTROLS
========================================================= */

function applyPreset() {
  const name = $("preset")?.value || "custom";
  const preset = PRESETS[name];

  if (!preset) return;

  rateValue = preset.rate;
  pitchValue = preset.pitch;

  updateControls();
}

$("preset")?.addEventListener("change", applyPreset);

function updateControls() {
  if ($("rate_value")) {
    $("rate_value").textContent =
      `${rateValue > 0 ? "+" : ""}${rateValue}%`;
  }

  if ($("pitch_value")) {
    $("pitch_value").textContent =
      `${pitchValue > 0 ? "+" : ""}${pitchValue}%`;
  }

  if ($("volume_value")) {
    $("volume_value").textContent =
      `${volumeValue > 0 ? "+" : ""}${volumeValue}%`;
  }
}

$("rate_minus")?.addEventListener("click", () => {
  rateValue = Math.max(-30, rateValue - 1);
  updateControls();
});

$("rate_plus")?.addEventListener("click", () => {
  rateValue = Math.min(30, rateValue + 1);
  updateControls();
});

$("pitch_minus")?.addEventListener("click", () => {
  pitchValue = Math.max(-20, pitchValue - 1);
  updateControls();
});

$("pitch_plus")?.addEventListener("click", () => {
  pitchValue = Math.min(20, pitchValue + 1);
  updateControls();
});

$("volume_minus")?.addEventListener("click", () => {
  volumeValue = Math.max(-20, volumeValue - 1);
  updateControls();
});

$("volume_plus")?.addEventListener("click", () => {
  volumeValue = Math.min(20, volumeValue + 1);
  updateControls();
});

document.querySelectorAll(".boost-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".boost-btn").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    volumeValue = Number(button.dataset.boost || 0);

    updateControls();
  });
});

$("advanced_toggle")?.addEventListener("click", () => {
  $("advanced_controls")?.classList.toggle("hidden");
});


/* =========================================================
   MONTHLY APP USAGE
   This is NOT the real Azure quota.
========================================================= */

function getCurrentMonth() {
  const now = new Date();

  return (
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0")
  );
}

let usage = {
  month: getCurrentMonth(),
  monthCharacters: 0,
  monthGenerations: 0,
  lastGeneration: ""
};

function saveUsage() {
  try {
    localStorage.setItem(
      "ai_voice_v3_usage",
      JSON.stringify(usage)
    );
  } catch (error) {
    console.warn("Usage save error:", error);
  }
}

function loadUsage() {
  try {
    const stored = localStorage.getItem("ai_voice_v3_usage");

    if (stored) {
      const parsed = JSON.parse(stored);

      if (parsed && typeof parsed === "object") {
        usage = { ...usage, ...parsed };
      }
    }

    if (usage.month !== getCurrentMonth()) {
      usage = {
        month: getCurrentMonth(),
        monthCharacters: 0,
        monthGenerations: 0,
        lastGeneration: ""
      };

      saveUsage();
    }
  } catch (error) {
    console.warn("Usage load error:", error);
  }

  updateUsage();
}

function recordUsage(characters) {
  const count = Math.max(0, Number(characters) || 0);

  usage.monthCharacters += count;
  usage.monthGenerations += 1;
  usage.lastGeneration = new Date().toLocaleString("hi-IN");

  saveUsage();
  updateUsage();
}

function updateUsage() {
  const used = Math.max(
    0,
    Number(usage.monthCharacters) || 0
  );

  const percent = Math.min(
    100,
    Math.round((used / USAGE_LIMIT) * 100)
  );

  const remaining = Math.max(0, USAGE_LIMIT - used);

  if ($("usage_percent")) {
    $("usage_percent").textContent = percent + "%";
  }

  if ($("usage_summary")) {
    $("usage_summary").textContent =
      `${used.toLocaleString("en-IN")} / 4,50,000 characters this month`;
  }

  if ($("usage_used")) {
    $("usage_used").textContent =
      `${used.toLocaleString("en-IN")} / 4,50,000 characters`;
  }

  if ($("usage_remaining")) {
    $("usage_remaining").textContent =
      `${remaining.toLocaleString("en-IN")} characters remaining`;
  }

  if ($("usage_generations")) {
    $("usage_generations").textContent =
      usage.monthGenerations || 0;
  }

  if ($("usage_last")) {
    $("usage_last").textContent =
      usage.lastGeneration || "अभी कोई generation नहीं";
  }

  if ($("usage_fill")) {
    $("usage_fill").style.width = percent + "%";
  }

  if ($("usage_mini")) {
    $("usage_mini").textContent = `📊 Usage ${percent}%`;
  }
}

function canUseCharacters(characters) {
  const count = Math.max(0, Number(characters) || 0);

  return usage.monthCharacters + count <= USAGE_LIMIT;
}

function openUsage() {
  $("usage_modal")?.classList.add("show");
}

$("usage_mini")?.addEventListener("click", openUsage);
$("usage_card")?.addEventListener("click", openUsage);

$("usage_close")?.addEventListener("click", () => {
  $("usage_modal")?.classList.remove("show");
});

$("usage_modal")?.addEventListener("click", event => {
  if (event.target === $("usage_modal")) {
    $("usage_modal").classList.remove("show");
  }
});


/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {
  try {
    const stored = localStorage.getItem("ai_voice_v3_settings");

    if (stored) {
      const parsed = JSON.parse(stored);

      if (parsed && typeof parsed === "object") {
        savedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed
        };
      }
    }
  } catch (error) {
    console.warn("Settings load error:", error);
  }
}

function populateSettingsVoiceList() {
  const select = $("setting_voice");

  if (!select) return;

  select.innerHTML = "";

  Object.entries(currentVoices).forEach(([key, voice]) => {
    const option = document.createElement("option");

    option.value = key;
    option.textContent = voice.label;

    select.appendChild(option);
  });

  if (currentVoices[savedSettings.voice]) {
    select.value = savedSettings.voice;
  } else if (select.options.length) {
    select.selectedIndex = 0;
  }
}

function fillSettingsForm() {
  if ($("setting_preset")) {
    $("setting_preset").value = savedSettings.preset;
  }

  if ($("setting_rate")) {
    $("setting_rate").value = String(savedSettings.rate);
  }

  if ($("setting_pitch")) {
    $("setting_pitch").value = String(savedSettings.pitch);
  }

  if ($("setting_volume")) {
    $("setting_volume").value = String(savedSettings.volume);
  }

  if ($("setting_director")) {
    $("setting_director").checked = savedSettings.director;
  }

  if ($("setting_emotion")) {
    $("setting_emotion").checked = savedSettings.emotion;
  }

  if ($("setting_pause")) {
    $("setting_pause").checked = savedSettings.pause;
  }

  if ($("setting_pronunciation")) {
    $("setting_pronunciation").checked =
      savedSettings.pronunciation;
  }

  populateSettingsVoiceList();
}

function applySavedSettings() {
  if ($("engine")) {
    $("engine").value = savedSettings.engine;
  }

  if ($("preset")) {
    $("preset").value = savedSettings.preset;
  }

  rateValue = Number(savedSettings.rate) || 0;
  pitchValue = Number(savedSettings.pitch) || 0;
  volumeValue = Number(savedSettings.volume) || 0;

  if ($("auto_director")) {
    $("auto_director").checked = savedSettings.director;
  }

  if ($("auto_emotion")) {
    $("auto_emotion").checked = savedSettings.emotion;
  }

  if ($("auto_pause")) {
    $("auto_pause").checked = savedSettings.pause;
  }

  if ($("pronunciation")) {
    $("pronunciation").checked = savedSettings.pronunciation;
  }

  updateControls();

  document.querySelectorAll(".boost-btn").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.boost || 0) === volumeValue
    );
  });

  populateSettingsVoiceList();
}

$("save_settings")?.addEventListener("click", () => {
  savedSettings = {
    ...savedSettings,

    voice: $("setting_voice")?.value || "arjun",

    preset: $("setting_preset")?.value || "custom",

    rate: Number($("setting_rate")?.value || 0),

    pitch: Number($("setting_pitch")?.value || 0),

    volume: Number($("setting_volume")?.value || 0),

    director: $("setting_director")?.checked ?? true,

    emotion: $("setting_emotion")?.checked ?? true,

    pause: $("setting_pause")?.checked ?? true,

    pronunciation: $("setting_pronunciation")?.checked ?? true
  };

  try {
    localStorage.setItem(
      "ai_voice_v3_settings",
      JSON.stringify(savedSettings)
    );

    applySavedSettings();

    if ($("settings_status")) {
      $("settings_status").textContent = "✅ Settings save हो गईं।";

      setTimeout(() => {
        if ($("settings_status")) {
          $("settings_status").textContent = "";
        }
      }, 2500);
    }
  } catch (error) {
    setStatus("❌ Settings save नहीं हो सकीं।", "error");
  }
});


/* =========================================================
   VOICE LIST
========================================================= */

function getVoiceLabel(key, voice) {
  return voice.label || voice.name || key;
}

function populateVoiceDropdown(preferredVoice) {
  const select = $("voice");

  if (!select) return;

  const oldVoice = preferredVoice || select.value;

  select.innerHTML = "";

  Object.entries(currentVoices).forEach(([key, voice]) => {
    const option = document.createElement("option");

    option.value = key;
    option.textContent = getVoiceLabel(key, voice);

    select.appendChild(option);
  });

  if (currentVoices[oldVoice]) {
    select.value = oldVoice;
  } else if (currentVoices.arjun) {
    select.value = "arjun";
  } else if (select.options.length) {
    select.selectedIndex = 0;
  }

  populateSettingsVoiceList();
}

function changeEngine(engine, preferredVoice) {
  const selectedEngine =
    engine === "azure" ? "azure" : "edge";

  currentVoices =
    selectedEngine === "azure" ? azureVoices : edgeVoices;

  if (!Object.keys(currentVoices).length) {
    setStatus(
      "❌ इस Engine की Voice List उपलब्ध नहीं है।",
      "error"
    );
    return;
  }

  if ($("engine")) {
    $("engine").value = selectedEngine;
  }

  populateVoiceDropdown(preferredVoice);

  savedSettings.engine = selectedEngine;
  savedSettings.voice = $("voice")?.value || "arjun";

  try {
    localStorage.setItem(
      "ai_voice_v3_settings",
      JSON.stringify(savedSettings)
    );
  } catch (_) {}
}

$("engine")?.addEventListener("change", () => {
  changeEngine($("engine").value);

  setStatus(
    $("engine").value === "edge"
      ? "🟢 Edge TTS चुना गया है।"
      : "🔵 Azure Speech चुना गया है।"
  );
});

$("voice")?.addEventListener("change", () => {
  savedSettings.voice = $("voice").value;
});


/* =========================================================
   AUDIO UTILITIES
========================================================= */

function base64ToBlobUrl(base64, mime = "audio/mpeg") {
  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return URL.createObjectURL(
    new Blob([bytes], { type: mime })
  );
}

async function readResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch (_) {
    throw new Error("सर्वर से सही Response नहीं मिला।");
  }

  if (!response.ok) {
    throw new Error(
      data.detail || "Voice generation असफल हुई।"
    );
  }

  if (!data.audio_base64) {
    throw new Error("सर्वर से Audio प्राप्त नहीं हुआ।");
  }

  return data;
}

function getRequestPayload(text) {
  return {
    text,

    engine: $("engine")?.value || DEFAULT_ENGINE,

    voice: $("voice")?.value || "arjun",

    style: $("style")?.value || "neutral",

    preset: $("preset")?.value || "custom",

    rate: rateValue,

    pitch: pitchValue,

    volume: volumeValue,

    auto_director: $("auto_director")?.checked ?? true,

    auto_emotion: $("auto_emotion")?.checked ?? true,

    auto_pause: $("auto_pause")?.checked ?? true,

    pronunciation: $("pronunciation")?.checked ?? true
  };
}


/* =========================================================
   PREVIEW HELPERS
========================================================= */

async function requestPreview(text, mode = "quick") {
  const characters = text.length;

  if (!text.trim()) {
    setStatus("⚠️ पहले Script लिखें।", "error");
    return;
  }

  if (!canUseCharacters(characters)) {
    setStatus(
      "⚠️ App monthly usage limit पूरी हो गई है।",
      "error"
    );
    return;
  }

  setStatus("⏳ Voice Preview बनाई जा रही है...", "loading");

  try {
    const response = await fetch("/api/preview", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(getRequestPayload(text))
    });

    const data = await readResponse(response);

    const url = base64ToBlobUrl(
      data.audio_base64,
      data.mime || "audio/mpeg"
    );

    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
    }

    previewAudioUrl = url;

    const audio = $("preview_audio");

    if (audio) {
      audio.classList.remove("hidden");
      audio.src = url;
      audio.load();
      audio.play().catch(() => {});
    }

    recordUsage(Number(data.characters ?? characters));

    setStatus(
      mode === "voice"
        ? "▶️ Voice Preview तैयार है।"
        : "▶️ Quick Preview तैयार है।",
      "success"
    );

  } catch (error) {
    setStatus("❌ " + error.message, "error");
  }
}


/* SELECTED VOICE PREVIEW */

async function previewVoice() {
  const text =
    "नमस्कार! यह AI Voice Studio की Voice Preview है।";

  await requestPreview(text, "voice");
}

$("selected_voice_preview")?.addEventListener(
  "click",
  previewVoice
);


/* QUICK PREVIEW */

$("preview")?.addEventListener("click", async () => {
  const fullText = $("text")?.value.trim() || "";

  if (!fullText) {
    setStatus("⚠️ पहले Script लिखें।", "error");
    return;
  }

  const previewText = fullText
    .split(/[।!?]/)
    .filter(Boolean)
    .slice(0, 2)
    .join("।");

  await requestPreview(
    previewText || fullText.slice(0, 350),
    "quick"
  );
});


/* =========================================================
   FULL GENERATION
========================================================= */

$("generate")?.addEventListener("click", generateVoice);

async function generateVoice() {
  if (isGenerating) return;

  const text = $("text")?.value.trim() || "";

  if (!text) {
    setStatus("⚠️ पहले Script लिखें।", "error");
    return;
  }

  if (text.length > 12000) {
    setStatus(
      "⚠️ Script 12000 characters से ज्यादा है।",
      "error"
    );
    return;
  }

  if (!canUseCharacters(text.length)) {
    setStatus(
      "⚠️ App monthly usage limit पूरी हो गई है।",
      "error"
    );
    return;
  }

  isGenerating = true;

  const button = $("generate");

  if (button) button.disabled = true;

  setStatus(
    "⏳ Professional Voice बनाई जा रही है...",
    "loading"
  );

  try {
    const response = await fetch("/api/tts", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(getRequestPayload(text))
  
