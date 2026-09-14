const $ = id => document.getElementById(id);

let configData = null;


async function init() {

    try {

        const r = await fetch("/api/config");

        if (!r.ok) {
            throw new Error("Config load failed");
        }

        configData = await r.json();

        $("voice").innerHTML =
            Object.entries(configData.voices)
            .map(([key, value]) =>
                `<option value="${key}">${value.label}</option>`
            )
            .join("");

    } catch (e) {

        $("status").textContent =
            "❌ Voice configuration load नहीं हुई।";

    }
}


init();


/* Character counter */

$("text").oninput = () => {

    $("count").textContent =
        $("text").value.length + " / 12000";

};


/* Clear */

$("clear").onclick = () => {

    $("text").value = "";

    $("count").textContent = "0 / 12000";

    $("out").classList.add("hidden");

    $("status").textContent = "";

};


/* Sliders */

[
    ["rate", "rv"],
    ["pitch", "pv"],
    ["volume", "vv"]
].forEach(pair => {

    $(pair[0]).oninput = () => {

        $(pair[1]).textContent =
            $(pair[0]).value + "%";

    };

});


/* Presets */

const PRESETS = {

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
    },

    custom: null

};


$("preset").onchange = () => {

    const p = PRESETS[$("preset").value];

    if (!p) return;

    $("style").value = p.style;

    $("rate").value = p.rate;

    $("pitch").value = p.pitch;

    $("rv").textContent = p.rate + "%";

    $("pv").textContent = p.pitch + "%";

};


/* Generate */

$("generate").onclick = async () => {

    const text = $("text").value.trim();

    if (!text) {

        $("status").textContent =
            "पहले script लिखें।";

        return;
    }


    $("generate").disabled = true;

    $("status").textContent =
        "⏳ Professional voice बनाई जा रही है...";


    try {

        const payload = {

            text: text,

            voice: $("voice").value,

            style: $("style").value,

            preset: $("preset").value,

            rate: Number($("rate").value),

            pitch: Number($("pitch").value),

            volume: Number($("volume").value),

            auto_director:
                $("autoDirector").checked,

            auto_emotion:
                $("autoEmotion").checked,

            auto_pause:
                $("autoPause").checked,

            pronunciation:
                $("pronunciation").checked

        };


        const response = await fetch(
            "/api/tts",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(payload)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Voice generation failed"
            );

        }


        const bytes =
            Uint8Array.from(
                atob(data.audio_base64),
                c => c.charCodeAt(0)
            );


        const blob =
            new Blob(
                [bytes],
                { type: data.mime }
            );


        const url =
            URL.createObjectURL(blob);


        $("audio").src = url;

        $("download").href = url;

        $("out").classList.remove("hidden");

        $("status").textContent =
            "✅ Professional Voice तैयार है!";


    } catch (error) {

        $("status").textContent =
            "❌ " + error.message;

    } finally {

        $("generate").disabled = false;

    }

};
