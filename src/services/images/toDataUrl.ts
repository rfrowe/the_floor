/**
 * Base64 / Blob → `data:` URL helpers.
 *
 * Studio slides store their image inline as a base64 `data:` URL
 * (`slide.imageUrl`, validated to start with `data:image/` in
 * `src/utils/jsonImport.ts`). `gpt-image-1` returns base64 directly, so the
 * common path is {@link b64ToDataUrl}; {@link blobToDataUrl} is the fallback for
 * a custom backend (or a proxy) that returns an image URL/blob instead — the
 * caller fetches it and converts here (CORS permitting).
 *
 * These helpers are deliberately framework-free so they can run in tests and the
 * browser alike. They live under `src/services/images/*` and pull in NO OpenAI
 * SDK, so they stay cheap to import.
 */

/** A conservative MIME-type matcher: `type` or `type/subtype` (letters, digits, `+`, `-`, `.`). */
const MIME_PATTERN = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i;

/** The MIME type used when a caller omits one (matches `gpt-image-1`'s PNG output). */
export const DEFAULT_IMAGE_MIME = 'image/png';

/**
 * Wrap a base64 string in a `data:` URL.
 *
 * @param b64 Raw base64 payload (no `data:` prefix). Must be non-empty.
 * @param mime The image MIME type (defaults to {@link DEFAULT_IMAGE_MIME}).
 * @throws {Error} if `b64` is empty/blank or `mime` is malformed — callers in
 *   the OpenAI layer map this to a `parse` {@link GenerationError}.
 */
export function b64ToDataUrl(b64: string, mime: string = DEFAULT_IMAGE_MIME): string {
  const trimmed = b64.trim();
  if (trimmed.length === 0) {
    throw new Error('Cannot build a data URL from empty base64 data.');
  }
  if (!MIME_PATTERN.test(mime)) {
    throw new Error(`Invalid image MIME type: "${mime}".`);
  }
  return `data:${mime};base64,${trimmed}`;
}

/**
 * Read a {@link Blob} into a `data:` URL via {@link FileReader}.
 *
 * The Blob's own `type` becomes the data URL's MIME (FileReader uses it); when
 * the Blob has no type, the result falls back to a generic `application/octet-stream`
 * per the FileReader spec — acceptable for the rare custom-backend fallback path.
 *
 * @throws {Error} if the read fails (rejected, not thrown synchronously).
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read image blob.'));
    };
    reader.onload = () => {
      const { result } = reader;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Unexpected non-string result reading image blob.'));
      }
    };
    reader.readAsDataURL(blob);
  });
}
