export const MAX_AVATAR_INPUT_BYTES = 10 * 1024 * 1024;

const DECODE_ERROR = "We couldn't read that image. Try a different photo.";

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decode(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> decoder.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(DECODE_ERROR));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export async function cropToSquareWebp(file: File, size = 512): Promise<Blob> {
  if (file.size > MAX_AVATAR_INPUT_BYTES) {
    throw new Error("That photo is too large. Choose one under 10 MB.");
  }

  const image = await decode(file);
  try {
    if (image.width === 0 || image.height === 0) throw new Error(DECODE_ERROR);

    const side = Math.min(image.width, image.height);
    const sx = (image.width - side) / 2;
    const sy = (image.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(DECODE_ERROR);
    ctx.drawImage(image.source, sx, sy, side, side, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.size === 0) throw new Error(DECODE_ERROR);
    return blob;
  } finally {
    image.release();
  }
}
