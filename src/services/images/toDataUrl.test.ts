/**
 * Tests for the base64 / Blob → `data:` URL helpers.
 */

import { describe, it, expect } from 'vitest';
import { b64ToDataUrl, blobToDataUrl, DEFAULT_IMAGE_MIME } from './toDataUrl';

describe('b64ToDataUrl', () => {
  it('wraps base64 in a PNG data URL by default', () => {
    expect(b64ToDataUrl('QUJD')).toBe('data:image/png;base64,QUJD');
  });

  it('uses the DEFAULT_IMAGE_MIME constant as the default', () => {
    expect(b64ToDataUrl('QUJD')).toBe(`data:${DEFAULT_IMAGE_MIME};base64,QUJD`);
  });

  it('honors an explicit MIME type', () => {
    expect(b64ToDataUrl('QUJD', 'image/jpeg')).toBe('data:image/jpeg;base64,QUJD');
  });

  it('trims surrounding whitespace from the payload', () => {
    expect(b64ToDataUrl('  QUJD\n')).toBe('data:image/png;base64,QUJD');
  });

  it('throws on empty/blank base64', () => {
    expect(() => b64ToDataUrl('')).toThrow();
    expect(() => b64ToDataUrl('   ')).toThrow();
  });

  it('throws on a malformed MIME type', () => {
    expect(() => b64ToDataUrl('QUJD', 'not-a-mime')).toThrow();
  });
});

describe('blobToDataUrl', () => {
  it('reads a blob into a data URL carrying its MIME type', async () => {
    const blob = new Blob(['ABC'], { type: 'image/png' });
    const url = await blobToDataUrl(blob);
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    // "ABC" → base64 "QUJD"
    expect(url).toBe('data:image/png;base64,QUJD');
  });
});
