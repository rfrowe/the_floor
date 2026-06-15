/**
 * Tests for buildGoogleImagesUrl: the answer (plus keywords when present) is
 * URL-encoded into a `tbm=isch` search; a blank answer yields `null` so the
 * caller can disable the button.
 */

import { describe, it, expect } from 'vitest';
import { buildGoogleImagesUrl } from './googleImages';

describe('buildGoogleImagesUrl', () => {
  it('builds a tbm=isch URL with the encoded answer + keywords', () => {
    expect(buildGoogleImagesUrl('The Terminator', 'movie robot')).toBe(
      'https://www.google.com/search?tbm=isch&q=The%20Terminator%20movie%20robot'
    );
  });

  it('uses the answer alone when keywords are blank', () => {
    expect(buildGoogleImagesUrl('Fox', '   ')).toBe('https://www.google.com/search?tbm=isch&q=Fox');
  });

  it('encodes special characters (ampersands, slashes)', () => {
    expect(buildGoogleImagesUrl('AT&T', '')).toBe(
      'https://www.google.com/search?tbm=isch&q=AT%26T'
    );
  });

  it('returns null for a blank answer', () => {
    expect(buildGoogleImagesUrl('   ', 'keywords')).toBeNull();
    expect(buildGoogleImagesUrl('', '')).toBeNull();
  });
});
