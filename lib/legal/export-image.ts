declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

async function loadScript(src: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`스크립트를 로드하지 못했습니다: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureHtml2Canvas(): Promise<void> {
  if (window.html2canvas) return;
  await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  if (!window.html2canvas) throw new Error("html2canvas가 로드되지 않았습니다.");
}

export async function exportLegalAsImage(targetId = "main"): Promise<void> {
  if (typeof window === "undefined") return;

  await ensureHtml2Canvas();
  const target = document.getElementById(targetId);
  if (!target) throw new Error(`캡처 타깃이 없습니다: #${targetId}`);

  const canvas = await window.html2canvas!(target, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `legal-calc-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export {};
