const $ = id => document.getElementById(id);

const PRESETS = {
  custom:     { style: "neutral", rate: 0, pitch: 0 },
  viral_fact: { style: "excited", rate: 5, pitch: 1 },
  news:       { style: "serious", rate: -2, pitch: -1 },
  mystery:    { style: "serious", rate: -7, pitch: -2 },
  story:      { style: "soft", rate: -3, pitch: 0 },
  education:  { style: "neutral", rate: -1, pitch: 0 },
  emotional:  { style: "sad", rate: -7, pitch: -2 },
  motivation: { style: "excited", rate: 3, pitch: 1 },
  funny:      { style: "happy", rate: 3, pitch: 1 }
};

function setStatus(message, className = "") {
  $("status").textContent = message;
  $("status").className = className;
}

function updateSliders() {
  $("rv").textContent = $("rate").value + "%";
  $("pv").textContent = $("pitch").value + "%";
  $("vv").textContent = $("volume").value + "%";
}

function applyPreset() {
  const p = PRESETS[$("preset").value];

  if (!p) return;

  $("style").value = p.style;
  $("rate").value = p.rate;
  $("pitch").value = p.pitch;

  updateSliders();
}

async function init() {
  try {
    const response = await fetch("/api/config?version=pro-v2");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Config failed");
    }

    $("voice").innerHTML =
      Object.entries(data.voices)
        .map(([key, voice]) =>
          `<option value="${key}">${voice.label}</option>`
        )
        .join("");

    $("style").innerHTML =
      data.styles
        .map(style =>
          `<option value="${style}">${style}</option>`
        )
        .join("");

    applyPreset();

  } catch (error) {
    setStatus("❌ " + error.message, "error");
  }
}

$("preset").onchange = applyPreset;

$("text").oninput = () => {
  $("count").textContent =
    $("text").value.length + " / 12000";
};

$("clear").onclick = () => {
  $("text").value = "";
  $("count").textContent = "0 / 12000";
  $("out").classList.add("hidden");
  setStatus("");
};

["rate", "pitch", "volume"].forEach(id => {
  $(id).oninput = updateSliders;
});

$("generate").onclick = async () => {

  const text = $("text").value.trim();

  if (!text) {
    setStatus("⚠️ पहले script लिखें।", "error");
    return;
  }

  $("generate").disabled = true;

  setStatus(
    "⏳ Professional voice बनाई जा रही है...",
    "loading"
  );

  try {

    const response = await fetch("/api/preview", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        text: text,

        voice: $("voice").value,

        style: $("style").value,

        preset: $("preset").value,

        rate: Number($("rate").value),

        pitch: Number($("pitch").value),

        volume: Number($("volume").value),

        auto_director:
          $("auto_director").checked,

        auto_emotion:
          $("auto_emotion").checked,

        auto_pause:
          $("auto_pause").checked,

        pronunciation:
          $("pronunciation").checked

      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Voice generation failed"
      );
    }

    const bytes =
      Uint8Array.from(
        atob(data.audio_base64),
        c => c.charCodeAt(0)
      );

    const audioUrl =
      URL.createObjectURL(
        new Blob(
          [bytes],
          { type: data.mime || "audio/mpeg" }
        )
      );

    $("audio").src = audioUrl;

    $("download").href = audioUrl;

    $("out").classList.remove("hidden");

    setStatus(
      "✅ PRO Voice तैयार है!",
      "success"
    );

  } catch (error) {

    setStatus(
      "❌ " + error.message,
      "error"
    );

  } finally {

    $("generate").disabled = false;

  }
};

updateSliders();
init();
