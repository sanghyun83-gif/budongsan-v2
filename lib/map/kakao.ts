export async function loadKakaoMapsSdk(appKey: string): Promise<void> {
  if (!appKey) throw new Error("Missing NEXT_PUBLIC_KAKAO_JS_KEY");

  if (typeof window !== "undefined" && window.kakao?.maps) {
    return;
  }

  const scriptId = "kakao-map-sdk";
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!existing) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Kakao SDK"));
    });
  } else {
    await new Promise<void>((resolve, reject) => {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Kakao SDK")), { once: true });
    });
  }

  const sdk = document.getElementById(scriptId) as HTMLScriptElement;
  sdk.dataset.loaded = "true";

  await new Promise<void>((resolve) => {
    window.kakao.maps.load(() => resolve());
  });
}

