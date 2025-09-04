export function addSuffix(filename: string, suffix: string) {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return filename + suffix;
  return filename.slice(0, dot) + suffix;
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = (e) => rej(e);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataURL: string): Promise<Blob> {
  const r = await fetch(dataURL);
  return await r.blob();
}

export function getImageDims(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Downscale an image blob to a max width, keeping aspect ratio.
 * Returns a JPEG blob to optimize size.
 */
export async function downscaleImage(
  fileOrBlob: File | Blob,
  maxWidth: number,
  quality = 0.9,
): Promise<Blob> {
  const dataUrl = await blobToDataURL(fileOrBlob);
  const { width, height } = await getImageDims(dataUrl);
  if (width <= maxWidth) {
    return fileOrBlob;
  }
  const scale = maxWidth / width;
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  canvas.width = targetW;
  canvas.height = targetH;

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    (img as any).crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resolve();
    };
    img.onerror = (e) => reject(e);
    (img as any).src = dataUrl;
  });

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob || new Blob());
      },
      "image/jpeg",
      quality,
    );
  });
}
