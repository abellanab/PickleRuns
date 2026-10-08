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

const MAX_QR_BYTES = 3 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function downscaleImage(file: File, maxSide = 1200): Promise<Blob> {
  if (file.size > MAX_AVATAR_INPUT_BYTES) {
    throw new Error("That image is too large. Choose one under 10 MB.");
  }

  const image = await decode(file);
  try {
    if (image.width === 0 || image.height === 0) throw new Error(DECODE_ERROR);

    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(DECODE_ERROR);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image.source, 0, 0, width, height);

    let blob = await canvasToBlob(canvas, "image/png");
    if (blob && blob.size > MAX_QR_BYTES) {
      blob = await canvasToBlob(canvas, "image/webp", 0.95);
    }
    if (!blob || blob.size === 0) throw new Error(DECODE_ERROR);
    return blob;
  } finally {
    image.release();
  }
}

interface Point {
  x: number;
  y: number;
}

export interface QrLocation {
  topLeftCorner: Point;
  topRightCorner: Point;
  bottomRightCorner: Point;
  bottomLeftCorner: Point;
}

export interface QrCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  quiet: number;
}

const QR_DETECT_MAX_SIDE = 1600;
const QR_FULL_RES_MAX_SIDE = 3000;
const QR_MIN_OUTPUT_SIDE = 600;
const QR_MAX_OUTPUT_SIDE = 1200;
const QR_MIN_QUIET_PX = 16;
const QR_PAD_RATIO = 0.015;

export function computeQrCrop(
  location: QrLocation,
  version: number,
  scale: number,
  imageWidth: number,
  imageHeight: number,
): QrCrop | null {
  const corners = [
    location.topLeftCorner,
    location.topRightCorner,
    location.bottomRightCorner,
    location.bottomLeftCorner,
  ];
  const xs = corners.map((c) => c.x / scale);
  const ys = corners.map((c) => c.y / scale);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const qrWidth = maxX - minX;
  const qrHeight = maxY - minY;
  if (!Number.isFinite(qrWidth) || !Number.isFinite(qrHeight) || qrWidth <= 0 || qrHeight <= 0) {
    return null;
  }

  const padX = qrWidth * QR_PAD_RATIO;
  const padY = qrHeight * QR_PAD_RATIO;
  const sx = Math.max(0, Math.floor(minX - padX));
  const sy = Math.max(0, Math.floor(minY - padY));
  const ex = Math.min(imageWidth, Math.ceil(maxX + padX));
  const ey = Math.min(imageHeight, Math.ceil(maxY + padY));
  if (ex <= sx || ey <= sy) return null;

  const moduleSize = qrWidth / (17 + 4 * version);
  const quiet = Math.max(QR_MIN_QUIET_PX, Math.round(4 * moduleSize));
  return { sx, sy, sw: ex - sx, sh: ey - sy, quiet };
}

async function detectQr(
  source: CanvasImageSource,
  width: number,
  height: number,
  scale: number,
): Promise<{ location: QrLocation; version: number } | null> {
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  const { default: jsQR } = await import("jsqr");
  const result = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
    inversionAttempts: "attemptBoth",
  });
  return result ? { location: result.location, version: result.version } : null;
}

async function canvasDecodes(canvas: HTMLCanvasElement): Promise<boolean> {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  const { default: jsQR } = await import("jsqr");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" }) !== null;
}

async function renderQrCrop(
  source: CanvasImageSource,
  crop: QrCrop,
): Promise<Blob | null> {
  const { sx, sy, sw, sh, quiet } = crop;
  const baseW = sw + 2 * quiet;
  const baseH = sh + 2 * quiet;
  const longest = Math.max(baseW, baseH);

  let factor = 1;
  let smoothing = true;
  if (longest < QR_MIN_OUTPUT_SIDE) {
    factor = Math.ceil(QR_MIN_OUTPUT_SIDE / longest);
    smoothing = false;
  } else if (longest > QR_MAX_OUTPUT_SIDE) {
    factor = QR_MAX_OUTPUT_SIDE / longest;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(baseW * factor));
  canvas.height = Math.max(1, Math.round(baseH * factor));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = smoothing;
  ctx.drawImage(source, sx, sy, sw, sh, quiet * factor, quiet * factor, sw * factor, sh * factor);

  if (!(await canvasDecodes(canvas))) return null;

  let blob = await canvasToBlob(canvas, "image/png");
  if (blob && blob.size > MAX_QR_BYTES) {
    blob = await canvasToBlob(canvas, "image/webp", 0.95);
  }
  return blob && blob.size > 0 ? blob : null;
}

export async function cropToQr(file: File): Promise<{ blob: Blob; cropped: boolean }> {
  if (file.size > MAX_AVATAR_INPUT_BYTES) {
    throw new Error("That image is too large. Choose one under 10 MB.");
  }

  const image = await decode(file);
  try {
    if (image.width === 0 || image.height === 0) throw new Error(DECODE_ERROR);

    const longest = Math.max(image.width, image.height);
    const scale = Math.min(1, QR_DETECT_MAX_SIDE / longest);

    try {
      let found = await detectQr(image.source, image.width, image.height, scale);
      let foundScale = scale;
      if (!found && scale < 1 && longest <= QR_FULL_RES_MAX_SIDE) {
        found = await detectQr(image.source, image.width, image.height, 1);
        foundScale = 1;
      }
      if (found) {
        const crop = computeQrCrop(
          found.location,
          found.version,
          foundScale,
          image.width,
          image.height,
        );
        const blob = crop ? await renderQrCrop(image.source, crop) : null;
        if (blob) return { blob, cropped: true };
      }
    } catch {
      // Detection is best-effort; fall back to the uncropped upload.
    }
  } finally {
    image.release();
  }

  return { blob: await downscaleImage(file), cropped: false };
}
