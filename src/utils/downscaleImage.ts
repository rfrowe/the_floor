/**
 * Downscale a user-uploaded image to a `data:` URL before it lands on a slide.
 *
 * Studio's Image step lets the user set a slide's picture by drag-and-drop or
 * file upload. The raw file is inlined as a base64 `data:` URL straight into
 * `slide.imageUrl`, which is then persisted to IndexedDB AND embedded in the
 * exported category JSON. A modern phone photo (12+ MP) bloats both — and base64
 * is ~33% larger than the underlying bytes. Capping the long edge and re-encoding
 * to JPEG at ingest shrinks the data URL that gets persisted and exported.
 *
 * The cap ({@link DEFAULT_MAX_EDGE}) and format match the bundled sample
 * categories in `public/categories/*.json`: those slide images are all JPEG with
 * a median long edge of ~1200px (p75 ~1600px), so a 1280px long-edge JPEG sits
 * squarely in their norm while still being a crisp full-screen clue.
 *
 * TESTABILITY: jsdom (the test environment) has no real canvas or image decoder,
 * so the DOM-touching work is isolated behind an injectable {@link DownscaleDeps}.
 * Production callers omit it and get the real `createImageBitmap` + `<canvas>`
 * pipeline; tests pass a stub and assert the dimension/format decisions without a
 * real raster. The pure sizing math lives in {@link computeTargetSize} and is
 * unit-tested directly.
 */

/** Output is always a valid `data:image/…;base64,…` URL (passes `jsonImport`'s `isSlide` check). */
const VALID_OUTPUT_MIME = /^image\/(jpeg|png|webp)$/;

/**
 * Default long-edge cap, in pixels. Chosen to match the sample categories'
 * norm (median long edge ~1200px, p75 ~1600px) and to stay sharp full-screen.
 */
export const DEFAULT_MAX_EDGE = 1280;

/** Default re-encode format — JPEG is dramatically smaller than PNG for photos. */
export const DEFAULT_OUTPUT_MIME = 'image/jpeg';

/** Default JPEG/WebP quality (ignored for PNG). */
export const DEFAULT_QUALITY = 0.85;

/** A pixel size (width/height pair). */
export interface PixelSize {
  readonly width: number;
  readonly height: number;
}

export interface DownscaleOptions {
  /** Long-edge cap in pixels; the image is scaled so `max(w, h) <= maxEdge`. */
  readonly maxEdge?: number;
  /**
   * Output MIME type. One of `image/jpeg`, `image/png`, `image/webp`.
   * Defaults to {@link DEFAULT_OUTPUT_MIME} (JPEG, much smaller for photos).
   */
  readonly mimeType?: string;
  /** Encoder quality for lossy formats, 0–1. Defaults to {@link DEFAULT_QUALITY}. */
  readonly quality?: number;
}

/** A decoded image we can read dimensions from and draw onto a canvas. */
export interface DecodedImage {
  readonly width: number;
  readonly height: number;
  /** Drawable source accepted by `CanvasRenderingContext2D.drawImage`. */
  readonly source: CanvasImageSource;
  /** Release any underlying resource (e.g. `ImageBitmap.close()`); optional. */
  readonly close?: () => void;
}

/**
 * The DOM-touching steps, isolated for testability.
 *
 * - `decode` turns the input blob into a {@link DecodedImage} (dimensions +
 *   drawable). Production uses `createImageBitmap`.
 * - `render` draws the decoded image scaled to `target` and returns a `data:` URL
 *   in `mimeType` at `quality`. Production uses an offscreen `<canvas>`.
 */
export interface DownscaleDeps {
  decode: (blob: Blob) => Promise<DecodedImage>;
  render: (
    image: DecodedImage,
    target: PixelSize,
    mimeType: string,
    quality: number
  ) => Promise<string>;
}

/**
 * Compute the target raster size for a long-edge cap, preserving aspect ratio.
 *
 * Images already within the cap are returned unchanged (never upscaled). The
 * result is rounded to whole pixels and floored at 1 so a tiny image can't round
 * to a zero-dimension canvas.
 *
 * @throws {Error} if `maxEdge` is not a positive finite number, or if the source
 *   dimensions are not positive finite numbers.
 */
export function computeTargetSize(source: PixelSize, maxEdge: number): PixelSize {
  if (!Number.isFinite(maxEdge) || maxEdge <= 0) {
    throw new Error(`maxEdge must be a positive number, got ${String(maxEdge)}.`);
  }
  const { width, height } = source;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(
      `Source dimensions must be positive numbers, got ${String(width)}x${String(height)}.`
    );
  }

  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Decode a blob to an {@link ImageBitmap} via the browser's `createImageBitmap`.
 * The bitmap is the drawable; callers must `close()` it when done.
 */
async function decodeWithImageBitmap(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('createImageBitmap is not available in this environment.');
  }
  const bitmap = await createImageBitmap(blob);
  return {
    width: bitmap.width,
    height: bitmap.height,
    source: bitmap,
    close: () => {
      bitmap.close();
    },
  };
}

/**
 * Draw a decoded image scaled to `target` onto a DOM `<canvas>` and export a
 * `data:` URL via `toDataURL`. Synchronous internally, but typed `Promise<string>`
 * to match {@link DownscaleDeps.render} (a custom decoder/encoder could be async).
 */
function renderWithCanvas(
  image: DecodedImage,
  target: PixelSize,
  mimeType: string,
  quality: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return Promise.reject(new Error('Could not get a 2D canvas context for downscaling.'));
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image.source, 0, 0, target.width, target.height);

  return Promise.resolve(canvas.toDataURL(mimeType, quality));
}

const defaultDeps: DownscaleDeps = {
  decode: decodeWithImageBitmap,
  render: renderWithCanvas,
};

/**
 * Downscale an image blob/file to a re-encoded `data:` URL, capping its long edge.
 *
 * If the image already fits within the cap it is NOT upscaled, but it is still
 * re-encoded to the requested format (so a large PNG photo still shrinks to a
 * compact JPEG). Aspect ratio is always preserved. The returned string is a
 * `data:image/…;base64,…` URL so it passes `jsonImport`'s `isSlide` validation
 * and renders directly in an `<img>`.
 *
 * @param blob The uploaded {@link Blob}/`File`.
 * @param options Cap ({@link DownscaleOptions.maxEdge}), output
 *   {@link DownscaleOptions.mimeType}, and {@link DownscaleOptions.quality}.
 * @param deps Injection point for the DOM decode/render steps (tests stub these).
 * @throws {Error} if the output MIME is unsupported, or decode/render fails
 *   (rejected). Callers in `ImagesStep` catch this and show a per-card message.
 */
export async function downscaleImageToDataUrl(
  blob: Blob,
  options: DownscaleOptions = {},
  deps: DownscaleDeps = defaultDeps
): Promise<string> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const mimeType = options.mimeType ?? DEFAULT_OUTPUT_MIME;
  const quality = options.quality ?? DEFAULT_QUALITY;

  if (!VALID_OUTPUT_MIME.test(mimeType)) {
    throw new Error(
      `Unsupported output MIME "${mimeType}"; use image/jpeg, image/png, or image/webp.`
    );
  }

  const image = await deps.decode(blob);
  try {
    const target = computeTargetSize({ width: image.width, height: image.height }, maxEdge);
    const dataUrl = await deps.render(image, target, mimeType, quality);
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('Downscale produced a non-image data URL.');
    }
    return dataUrl;
  } finally {
    image.close?.();
  }
}
