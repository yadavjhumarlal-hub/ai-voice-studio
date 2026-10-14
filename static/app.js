async function generatePreviewFromScript(text){

  if(
    usage.monthCharacters + text.length >
    USAGE_LIMIT
  ){
    setStatus(
      "⚠️ App monthly usage limit पूरी हो गई है।",
      "error"
    );
    return;
  }

  setStatus(
    "⏳ Quick Preview बनाई जा रही है...",
    "loading"
  );

  try{

    const response = await fetch(
      "/api/preview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          engine: $("engine")?.value || "edge",
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
        })
      }
    );

    const data = await response.json();

    if(!response.ok){
      throw new Error(
        data.detail || "Preview failed"
      );
    }

    const url = base64ToBlobUrl(
      data.audio_base64,
      data.mime || "audio/mpeg"
    );

    if($("preview_audio")){
      $("preview_audio").classList.remove("hidden");
      $("preview_audio").src = url;
      $("preview_audio").play().catch(()=>{});
    }

    const previewCharacters = Number(
      data.characters || text.length
    );

    usage.monthCharacters += previewCharacters;
    usage.monthGenerations += 1;
    usage.lastGeneration =
      new Date().toLocaleString("hi-IN");

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
