declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    jspdf?: {
      jsPDF: new (options?: { orientation?: string; unit?: string; format?: string }) => {
        internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
        addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
        addPage: () => void;
        save: (filename: string) => void;
      };
    };
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

async function ensureLibraries(): Promise<void> {
  if (!window.html2canvas) {
    await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  }
  if (!window.jspdf?.jsPDF) {
    await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");
  }
  if (!window.html2canvas || !window.jspdf?.jsPDF) {
    throw new Error("PDF 라이브러리 로드에 실패했습니다.");
  }
}

export async function exportLegalAsPdf(targetId = "main"): Promise<void> {
  if (typeof window === "undefined") return;

  await ensureLibraries();
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

  const imgData = canvas.toDataURL("image/png");
  const pdf = new window.jspdf!.jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`legal-calc-${Date.now()}.pdf`);
}

export {};
