/**
 * Tests for the upload downscaler.
 *
 * jsdom has no real canvas or image decoder, so the DOM-touching work is injected
 * via {@link DownscaleDeps}: a stub `decode` reports chosen source dimensions and
 * a stub `render` captures the target size + mime it was asked to produce and
 * returns a synthetic `data:` URL. That lets us assert the sizing/format DECISIONS
 * (an oversized image is capped to the long edge preserving aspect ratio; a
 * within-cap image is left at its native size; output carries the requested mime
 * and is a valid `data:image/…` URL) without rasterizing anything.
 *
 * The pure math in {@link computeTargetSize} is also exercised directly.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  downscaleImageToDataUrl,
  computeTargetSize,
  DEFAULT_MAX_EDGE,
  DEFAULT_OUTPUT_MIME,
  DEFAULT_QUALITY,
  type DecodedImage,
  type DownscaleDeps,
  type PixelSize,
} from './downscaleImage';

/** A no-op drawable; the stub render never touches it, so its shape is irrelevant. */
const fakeSource = {} as CanvasImageSource;

/**
 * Build injectable deps whose `decode` reports the given source size and whose
 * `render` records what it was asked to produce, returning a synthetic data URL
 * that echoes the target dimensions (so the test can read them off the output).
 */
function makeDeps(sourceSize: PixelSize): {
  deps: DownscaleDeps;
  closed: { current: boolean };
  lastRender: { target?: PixelSize; mime?: string; quality?: number };
} {
  const closed = { current: false };
  const lastRender: { target?: PixelSize; mime?: string; quality?: number } = {};

  const decode = vi.fn(
    (_blob: Blob): Promise<DecodedImage> =>
      Promise.resolve({
        width: sourceSize.width,
        height: sourceSize.height,
        source: fakeSource,
        close: () => {
          closed.current = true;
        },
      })
  );

  const render = vi.fn(
    (_image: DecodedImage, target: PixelSize, mime: string, quality: number): Promise<string> => {
      lastRender.target = target;
      lastRender.mime = mime;
      lastRender.quality = quality;
      const subtype = mime.slice('image/'.length);
      return Promise.resolve(
        `data:${mime};base64,W${String(target.width)}H${String(target.height)}_${subtype}`
      );
    }
  );

  return { deps: { decode, render }, closed, lastRender };
}

/** A throwaway blob; the stub decode ignores its bytes. */
function blob(): Blob {
  return new Blob(['x'], { type: 'image/png' });
}

describe('computeTargetSize', () => {
  it('caps an oversized landscape image to the long edge, preserving aspect ratio', () => {
    // 4000x3000 (4:3), cap 1280 → long edge becomes 1280, short edge scales.
    expect(computeTargetSize({ width: 4000, height: 3000 }, 1280)).toEqual({
      width: 1280,
      height: 960,
    });
  });

  it('caps an oversized portrait image by its (taller) long edge', () => {
    // 3000x4000, cap 1280 → height becomes 1280, width scales.
    expect(computeTargetSize({ width: 3000, height: 4000 }, 1280)).toEqual({
      width: 960,
      height: 1280,
    });
  });

  it('leaves a within-cap image at its native size (no upscaling)', () => {
    expect(computeTargetSize({ width: 800, height: 600 }, 1280)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('leaves an image exactly at the cap unchanged', () => {
    expect(computeTargetSize({ width: 1280, height: 720 }, 1280)).toEqual({
      width: 1280,
      height: 720,
    });
  });

  it('rounds fractional results and floors dimensions at 1px', () => {
    // 10000x3 capped at 1280 → width 1280, height rounds to <1 but floors to 1.
    const result = computeTargetSize({ width: 10000, height: 3 }, 1280);
    expect(result.width).toBe(1280);
    expect(result.height).toBe(1);
  });

  it('throws on a non-positive cap or invalid source dimensions', () => {
    expect(() => computeTargetSize({ width: 100, height: 100 }, 0)).toThrow();
    expect(() => computeTargetSize({ width: 0, height: 100 }, 1280)).toThrow();
  });
});

describe('downscaleImageToDataUrl', () => {
  it('downscales an oversized image to the cap and returns a valid data URL', async () => {
    const { deps, lastRender } = makeDeps({ width: 4032, height: 3024 }); // 12 MP phone photo

    const url = await downscaleImageToDataUrl(blob(), { maxEdge: 1280 }, deps);

    expect(lastRender.target).toEqual({ width: 1280, height: 960 });
    expect(url).toMatch(/^data:image\//);
    // Echoed target dimensions confirm the render was asked for the capped size.
    expect(url).toContain('W1280H960');
  });

  it('leaves a within-cap image at its native dimensions but still re-encodes', async () => {
    const { deps, lastRender } = makeDeps({ width: 800, height: 600 });

    const url = await downscaleImageToDataUrl(blob(), { maxEdge: 1280 }, deps);

    expect(lastRender.target).toEqual({ width: 800, height: 600 });
    expect(url).toContain('W800H600');
    expect(url).toMatch(/^data:image\//);
  });

  it('defaults to a JPEG long-edge cap and 0.85 quality', async () => {
    const { deps, lastRender } = makeDeps({ width: 5000, height: 5000 });

    const url = await downscaleImageToDataUrl(blob(), {}, deps);

    expect(lastRender.mime).toBe(DEFAULT_OUTPUT_MIME);
    expect(lastRender.mime).toBe('image/jpeg');
    expect(lastRender.quality).toBe(DEFAULT_QUALITY);
    expect(lastRender.target).toEqual({ width: DEFAULT_MAX_EDGE, height: DEFAULT_MAX_EDGE });
    expect(url).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('honors an explicit output mime (webp) and quality', async () => {
    const { deps, lastRender } = makeDeps({ width: 2000, height: 1000 });

    const url = await downscaleImageToDataUrl(
      blob(),
      { maxEdge: 1280, mimeType: 'image/webp', quality: 0.7 },
      deps
    );

    expect(lastRender.mime).toBe('image/webp');
    expect(lastRender.quality).toBe(0.7);
    expect(url).toMatch(/^data:image\/webp;base64,/);
  });

  it('releases the decoded image (close) even though it returns a data URL', async () => {
    const { deps, closed } = makeDeps({ width: 4000, height: 3000 });

    await downscaleImageToDataUrl(blob(), { maxEdge: 1280 }, deps);

    expect(closed.current).toBe(true);
  });

  it('rejects an unsupported output mime before touching the DOM deps', async () => {
    const { deps } = makeDeps({ width: 100, height: 100 });

    await expect(downscaleImageToDataUrl(blob(), { mimeType: 'image/gif' }, deps)).rejects.toThrow(
      /Unsupported output MIME/
    );
    // Decode/render must not have run for an invalid request.
    expect(vi.mocked(deps.decode)).not.toHaveBeenCalled();
    expect(vi.mocked(deps.render)).not.toHaveBeenCalled();
  });

  it('rejects (and still closes) when render yields a non-image data URL', async () => {
    const closed = { current: false };
    const deps: DownscaleDeps = {
      decode: () =>
        Promise.resolve({
          width: 4000,
          height: 3000,
          source: fakeSource,
          close: () => {
            closed.current = true;
          },
        }),
      render: () => Promise.resolve('data:text/plain;base64,bogus'),
    };

    await expect(downscaleImageToDataUrl(blob(), {}, deps)).rejects.toThrow(/non-image data URL/);
    expect(closed.current).toBe(true);
  });
});
