"use strict";

/* =====================================================
   AI VOICE STUDIO PRO V3.3
   Azure Speech + Edge TTS
   Audio JSON/Base64 Compatible Frontend
===================================================== */

const $ = (id) => document.getElementById(id);

const DEFAULT_ENGINE = "edge";
const USAGE_LIMIT = 450000;

const STORAGE_SETTINGS = "ai_voice_v3_settings";
const STORAGE_USAGE = "ai_voice_v3_usage";
const STORAGE_HISTORY = "ai_voice_v3_history";

let config = {};
let azureVoices = {};
let edgeVoices = {};
let currentAudioUrl = null;
let isGenerating = false;

let savedSettings = {
    engine: DEFAULT_ENGINE,
    voice: "arjun",
    preset: "custom",
    rate: 0,
    pitch: 0,
    volume: 0,
    auto_director: true,
    auto_emotion: true,
    auto_pause: true,
    pronunciation: true
};


/* =====================================================
   GENERAL HELPERS
===================================================== */

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function setValue(id, value) {
    const element = $(id);
    if (element) element.value = value;
}

function showElement(id) {
    const element = $(id);
    if (element) element.classList.remove("hidden");
}

function hideElement(id) {
    const element = $(id);
    if (element) element.classList.add("hidden");
}

function getValue(id, fallback = "") {
    const element = $(id);
    return element ? element.value : fallback;
}

function getChecked(id, fallback = false) {
    const element = $(id);
    return element ? element.checked : fallback;
}

function showMessage(message, type = "info") {
    console.log(`[${type.toUpperCase()}] ${message}`);

    let box = $("app_message");

    if (!box) {
        box = document.createElement("div");
        box.id = "app_message";

        box.style.position = "fixed";
        box.style.left = "12px";
        box.style.right = "12px";
        box.style.bottom = "20px";
        box.style.zIndex = "99999";
        box.style.padding = "14px";
        box.style.borderRadius = "10px";
        box.style.background = "#222";
        box.style.color = "#fff";
        box.style.fontSize = "14px";
        box.style.boxShadow = "0 4px 18px #0003";

        document.body.appendChild(box);
    }

    box.textContent = message;
    box.dataset.type = type;
    box.style.display = "block";

    clearTimeout(box._hideTimer);

    box._hideTimer = setTimeout(() => {
        box.style.display = "none";
    }, 7000);
}

function setBusy(busy, buttonId) {
    isGenerating = busy;

    const ids = [
        "generate",
        "generate_btn",
        "professional_generate",
        "quick_preview",
        "preview",
        "selected_voice_preview"
    ];

    ids.forEach((id) => {
        const button = $(id);
        if (button) button.disabled = busy;
    });

    if (buttonId && $(buttonId)) {
        $(buttonId).disabled = busy;
    }

    if (busy) {
        setText("generate_status", "ऑडियो बनाया जा रहा है...");
    } else {
        setText("generate_status", "");
    }
}


/* =====================================================
   SETTINGS STORAGE
===================================================== */

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_SETTINGS);

        if (raw) {
            const parsed = JSON.parse(raw);

            savedSettings = {
                ...savedSettings,
                ...parsed
            };
        }
    } catch (error) {
        console.error("Settings load error:", error);
    }
}

function saveSettings() {
    try {
        localStorage.setItem(
            STORAGE_SETTINGS,
            JSON.stringify(savedSettings)
        );
    } catch (error) {
        console.error("Settings save error:", error);
    }
}

function syncSettingsFromUI() {
    savedSettings.engine = getValue(
        "engine",
        savedSettings.engine
    );

    savedSettings.voice = getValue(
        "voice",
        savedSettings.voice
    );

    savedSettings.preset = getValue(
        "preset",
        savedSettings.preset
    );

    savedSettings.rate = Number(
        getValue("rate", savedSettings.rate)
    );

    savedSettings.pitch = Number(
        getValue("pitch", savedSettings.pitch)
    );

    savedSettings.volume = Number(
        getValue("volume", savedSettings.volume)
    );

    savedSettings.auto_director = getChecked(
        "auto_director",
        savedSettings.auto_director
    );

    savedSettings.auto_emotion = getChecked(
        "auto_emotion",
        savedSettings.auto_emotion
    );

    savedSettings.auto_pause = getChecked(
        "auto_pause",
        savedSettings.auto_pause
    );

    savedSettings.pronunciation = getChecked(
        "pronunciation",
        savedSettings.pronunciation
    );

    saveSettings();
}


/* =====================================================
   USAGE COUNTER
   Note: This is only a local browser counter.
   It is not the actual Azure quota.
===================================================== */

function getUsage() {
    try {
        const raw = localStorage.getItem(STORAGE_USAGE);

        if (!raw) {
            return {
                date: new Date().toDateString(),
                characters: 0
            };
        }

        const data = JSON.parse(raw);

        if (data.date !== new Date().toDateString()) {
            return {
                date: new Date().toDateString(),
                characters: 0
            };
        }

        return data;
    } catch {
        return {
            date: new Date().toDateString(),
            characters: 0
        };
    }
}

function loadUsage() {
    updateUsageDisplay();
}

function updateUsageDisplay() {
    const usage = getUsage();

    const used = usage.characters || 0;
    const remaining = Math.max(0, USAGE_LIMIT - used);

    setText(
        "usage_count",
        `${used.toLocaleString()} / ${USAGE_LIMIT.toLocaleString()}`
    );

    setText(
        "usage_value",
        `${used.toLocaleString()} / ${USAGE_LIMIT.toLocaleString()}`
    );

    setText(
        "usage_remaining",
        remaining.toLocaleString()
    );

    const percent = Math.min(
        100,
        (used / USAGE_LIMIT) * 100
    );

    const progress = $("usage_progress");

    if (progress) {
        progress.style.width = `${percent}%`;
    }
}

function canGenerate(text) {
    const usage = getUsage();
    const length = text.length;

    if (usage.characters + length > USAGE_LIMIT) {
        showMessage(
            "इस ब्राउज़र के स्थानीय usage counter की सीमा पूरी हो गई है।",
            "error"
        );

        return false;
    }

    return true;
}

function addUsage(text) {
    const usage = getUsage();

    usage.characters += text.length;
    usage.date = new Date().toDateString();

    try {
        localStorage.setItem(
            STORAGE_USAGE,
            JSON.stringify(usage)
        );
    } catch (error) {
        console.error("Usage save error:", error);
    }

    updateUsageDisplay();
}


/* =====================================================
   CONFIGURATION
===================================================== */

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);

    const contentType = (
        response.headers.get("content-type") || ""
    ).toLowerCase();

    if (!contentType.includes("application/json")) {
        const body = await response.text();

        throw new Error(
            `सर्वर ने JSON के बजाय ${contentType || "अनजान डेटा"} भेजा। ` +
            `HTTP ${response.status}. ` +
            body.slice(0, 180)
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "सर्वर का JSON उत्तर पढ़ा नहीं जा सका।"
        );
    }

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.message ||
            `HTTP ${response.status}`
        );
    }

    return data;
}

function normalizeVoices(rawVoices) {
    const result = {};

    if (!rawVoices || typeof rawVoices !== "object") {
        return result;
    }

    for (const [key, value] of Object.entries(rawVoices)) {
        if (typeof value === "string") {
            result[key] = {
                name: value,
                label: key
            };
        } else if (value && typeof value === "object") {
            result[key] = {
                name: value.name || key,
                label: value.label || key
            };
        }
    }

    return result;
}

function populateVoiceDropdown(preferredVoice) {
    const voiceSelect = $("voice");

    if (!voiceSelect) return;

    const engine = getValue("engine", DEFAULT_ENGINE);

    const voices = engine === "azure"
        ? azureVoices
        : edgeVoices;

    voiceSelect.innerHTML = "";

    const entries = Object.entries(voices);

    if (entries.length === 0) {
        const option = document.createElement("option");

        option.value = "";
        option.textContent = "कोई आवाज़ उपलब्ध नहीं";

        voiceSelect.appendChild(option);

        showMessage(
            `${engine === "edge" ? "Edge" : "Azure"} की आवाज़ों की सूची खाली है।`,
            "error"
        );

        return;
    }

    for (const [key, voice] of entries) {
        const option = document.createElement("option");

        option.value = key;
        option.textContent = voice.label || key;

        voiceSelect.appendChild(option);
    }

    if (
        preferredVoice &&
        voices[preferredVoice]
    ) {
        voiceSelect.value = preferredVoice;
    } else {
        voiceSelect.selectedIndex = 0;
    }

    savedSettings.voice = voiceSelect.value;
    saveSettings();
}

async function loadConfig() {
    try {
        config = await fetchJSON(
            "/api/config?version=pro-v3"
        );

        azureVoices = normalizeVoices(config.voices);
        edgeVoices = normalizeVoices(config.edge_voices);

        const engineSelect = $("engine");

        if (engineSelect) {
            engineSelect.value =
                savedSettings.engine || DEFAULT_ENGINE;
        }

        const engine = getValue("engine", DEFAULT_ENGINE);

        const availableVoices = engine === "azure"
            ? azureVoices
            : edgeVoices;

        const preferredVoice = availableVoices[
            savedSettings.voice
        ]
            ? savedSettings.voice
            : "";

        populateVoiceDropdown(preferredVoice);

        applySavedSettingsToControls();

        showMessage(
            `कॉन्फ़िगरेशन लोड हो गया। Engine: ${engine}`,
            "success"
        );

    } catch (error) {
        console.error("Config error:", error);

        showMessage(
            "कॉन्फ़िगरेशन लोड नहीं हुआ: " + error.message,
            "error"
        );
    }
}


/* =====================================================
   ENGINE SELECTION
===================================================== */

function changeEngine() {
    const engine = getValue("engine", DEFAULT_ENGINE);

    savedSettings.engine = engine;

    const voices = engine === "azure"
        ? azureVoices
        : edgeVoices;

    const preferredVoice = voices[savedSettings.voice]
        ? savedSettings.voice
        : "";

    populateVoiceDropdown(preferredVoice);

    saveSettings();

    showMessage(
        `${engine === "edge" ? "Edge TTS" : "Azure Speech"} चुना गया।`,
        "success"
    );
}


/* =====================================================
   SETTINGS CONTROLS
===================================================== */

function applySavedSettingsToControls() {
    const settings = [
        ["preset", savedSettings.preset],
        ["rate", savedSettings.rate],
        ["pitch", savedSettings.pitch],
        ["volume", savedSettings.volume],
        ["auto_director", savedSettings.auto_director],
        ["auto_emotion", savedSettings.auto_emotion],
        ["auto_pause", savedSettings.auto_pause],
        ["pronunciation", savedSettings.pronunciation]
    ];

    for (const [id, value] of settings) {
        const element = $(id);

        if (!element) continue;

        if (element.type === "checkbox") {
            element.checked = Boolean(value);
        } else {
            element.value = value;
        }
    }

    updateControls();
}

function updateControls() {
    const rate = Number(getValue("rate", 0));
    const pitch = Number(getValue("pitch", 0));
    const volume = Number(getValue("volume", 0));

    setText("rate_value", `${rate}%`);
    setText("pitch_value", `${pitch}`);
    setText("volume_value", `${volume}%`);

    setText("setting_rate_value", `${rate}%`);
    setText("setting_pitch_value", `${pitch}`);
    setText("setting_volume_value", `${volume}%`);
}


/* =====================================================
   REQUEST PAYLOAD
===================================================== */

function getScriptText() {
    const candidates = [
        "script",
        "script_text",
        "text",
        "scriptInput"
    ];

    for (const id of candidates) {
        const element = $(id);

        if (element && typeof element.value === "string") {
            return element.value.trim();
        }
    }

    return "";
}

function getRequestPayload(text) {
    syncSettingsFromUI();

    return {
        text: text,

        engine: getValue(
            "engine",
            savedSettings.engine || DEFAULT_ENGINE
        ),

        voice: getValue(
            "voice",
            savedSettings.voice || "arjun"
        ),

        style: getValue("style", "neutral"),

        preset: getValue("preset", "custom"),

        rate: Number(getValue("rate", 0)),
        pitch: Number(getValue("pitch", 0)),
        volume: Number(getValue("volume", 0)),

        auto_director: getChecked("auto_director", true),
        auto_emotion: getChecked("auto_emotion", true),
        auto_pause: getChecked("auto_pause", true),
        pronunciation: getChecked("pronunciation", true)
    };
}


/* =====================================================
   AUDIO RESPONSE DECODER

   Supports:
   1. JSON containing audio_base64
   2. JSON containing audio/data base64
   3. Direct MP3/audio responses

   This is the main fix for the JSON/MP3 mismatch.
===================================================== */

function base64ToBlob(base64, mimeType = "audio/mpeg") {
    const cleanBase64 = String(base64)
        .replace(/^data:.*?;base64,/, "")
        .replace(/\s/g, "");

    const binary = atob(cleanBase64);

    const chunks = [];
    const chunkSize = 1024;

    for (
        let offset = 0;
        offset < binary.length;
        offset += chunkSize
    ) {
        const slice = binary.slice(
            offset,
            offset + chunkSize
        );

        const bytes = new Uint8Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            bytes[i] = slice.charCodeAt(i);
        }

        chunks.push(bytes);
    }

    return new Blob(chunks, {
        type: mimeType
    });
}

async function readAudioResponse(response) {
    const contentType = (
        response.headers.get("content-type") || ""
    ).toLowerCase();

    /*
      If the server directly returns MP3,
      do not call response.json().
    */

    if (
        contentType.includes("audio/") ||
        contentType.includes("application/octet-stream")
    ) {
        if (!response.ok) {
            throw new Error(
                `ऑडियो सर्वर त्रुटि: HTTP ${response.status}`
            );
        }

        return await response.blob();
    }

    /*
      Otherwise try to read the JSON response.
    */

    const rawText = await response.text();

    let data;

    try {
        data = JSON.parse(rawText);
    } catch {
        throw new Error(
            `सर्वर ने न JSON दिया, न पहचाना हुआ ऑडियो। ` +
            `HTTP ${response.status}. ` +
            `उत्तर: ${rawText.slice(0, 160)}`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.message ||
            `HTTP ${response.status}`
        );
    }

    if (data.success === false) {
        throw new Error(
            data.detail ||
            data.message ||
            "ऑडियो बनाना विफल रहा।"
        );
    }

    /*
      Format used by the updated main.py:
      {
        success: true,
        audio_base64: "...",
        mime_type: "audio/mpeg"
      }
    */

    const encodedAudio =
        data.audio_base64 ||
        data.audio ||
        data.audio_data ||
        data.data;

    if (typeof encodedAudio === "string") {
        const mimeType =
            data.mime_type ||
            data.content_type ||
            "audio/mpeg";

        return base64ToBlob(
            encodedAudio,
            mimeType
        );
    }

    /*
      Support JSON data URLs as well.
    */

    if (
        typeof data.audio_url === "string" &&
        data.audio_url.startsWith("data:")
    ) {
        const parts = data.audio_url.split(",");

        if (parts.length === 2) {
            const mimeMatch = parts[0].match(
                /data:([^;]+)/
            );

            return base64ToBlob(
                parts[1],
                mimeMatch ? mimeMatch[1] : "audio/mpeg"
            );
        }
    }

    throw new Error(
        "JSON मिला, लेकिन उसमें audio_base64 नहीं है। " +
        "main.py और app.js के ऑडियो प्रारूप अलग हैं।"
    );
}


/* =====================================================
   AUDIO PLAYER
===================================================== */

function getAudioElement(preview = false) {
    if (preview) {
        return $("preview_audio") || $("audio");
    }

    return $("audio") ||
        $("generated_audio") ||
        $("preview_audio");
}

function clearPreviousAudio() {
    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
    }
}

function playAudioBlob(blob, preview = false) {
    if (!blob || blob.size === 0) {
        throw new Error("ऑडियो फ़ाइल खाली है।");
    }

    clearPreviousAudio();

    currentAudioUrl = URL.createObjectURL(blob);

    const audioElement = getAudioElement(preview);

    if (audioElement) {
        audioElement.src = currentAudioUrl;
        audioElement.classList.remove("hidden");
        audioElement.load();

        if (!preview) {
            audioElement.play().catch(() => {
                // Mobile browsers may require a manual tap.
            });
        }
    }

    const downloadButton = $("download");
    const downloadLink = $("download_link");

    if (!preview) {
        if (downloadButton) {
            downloadButton.disabled = false;

            downloadButton.onclick = () => {
                const link = document.createElement("a");

                link.href = currentAudioUrl;
                link.download = "ai-voice-studio.mp3";

                document.body.appendChild(link);
                link.click();
                link.remove();
            };
        }

        if (downloadLink) {
            downloadLink.href = currentAudioUrl;
            downloadLink.download = "ai-voice-studio.mp3";
            downloadLink.classList.remove("hidden");
        }
    }

    return currentAudioUrl;
}


/* =====================================================
   GENERATE / PREVIEW API
===================================================== */

async function requestAudio(endpoint, text, preview = false) {
    if (isGenerating) return;

    if (!text || !text.trim()) {
        showMessage(
            "कृपया पहले स्क्रिप्ट लिखें।",
            "error"
        );
        return;
    }

    if (!canGenerate(text)) return;

    setBusy(true);

    try {
        const payload = getRequestPayload(text);

        const response = await fetch(endpoint, {
            method: "POST",

            headers: {
                "Content
