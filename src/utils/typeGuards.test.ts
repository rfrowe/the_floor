/**
 * Dedicated tests for type guard functions
 * Testing type guards with valid and invalid data as per Task 24 requirements
 */

import { describe, it, expect } from 'vitest';
import { isCensorBox, isSlide, isCategory } from './jsonImport';

describe('Type Guards', () => {
  describe('isCensorBox', () => {
    it('accepts valid CensorBox objects', () => {
      const validBox = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        color: '#ff0000',
      };
      expect(isCensorBox(validBox)).toBe(true);
    });

    it('accepts CensorBox with decimal values', () => {
      const validBox = {
        x: 10.5,
        y: 20.3,
        width: 100.8,
        height: 50.2,
        color: '#00ff00',
      };
      expect(isCensorBox(validBox)).toBe(true);
    });

    it('accepts CensorBox with zero values', () => {
      const validBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        color: '#000000',
      };
      expect(isCensorBox(validBox)).toBe(true);
    });

    it('rejects CensorBox with negative x', () => {
      const invalidBox = {
        x: -10,
        y: 20,
        width: 100,
        height: 50,
        color: '#ff0000',
      };
      expect(isCensorBox(invalidBox)).toBe(false);
    });

    it('rejects CensorBox with negative y', () => {
      const invalidBox = {
        x: 10,
        y: -20,
        width: 100,
        height: 50,
        color: '#ff0000',
      };
      expect(isCensorBox(invalidBox)).toBe(false);
    });

    it('rejects CensorBox with negative width', () => {
      const invalidBox = {
        x: 10,
        y: 20,
        width: -100,
        height: 50,
        color: '#ff0000',
      };
      expect(isCensorBox(invalidBox)).toBe(false);
    });

    it('rejects CensorBox with negative height', () => {
      const invalidBox = {
        x: 10,
        y: 20,
        width: 100,
        height: -50,
        color: '#ff0000',
      };
      expect(isCensorBox(invalidBox)).toBe(false);
    });

    it('rejects CensorBox with missing fields', () => {
      expect(isCensorBox({ x: 10, y: 20, width: 100, height: 50 })).toBe(false); // missing color
      expect(isCensorBox({ x: 10, y: 20, width: 100, color: '#fff' })).toBe(false); // missing height
      expect(isCensorBox({ x: 10, y: 20, height: 50, color: '#fff' })).toBe(false); // missing width
    });

    it('rejects CensorBox with wrong types', () => {
      expect(isCensorBox({ x: '10', y: 20, width: 100, height: 50, color: '#fff' })).toBe(false); // x is string
      expect(isCensorBox({ x: 10, y: 20, width: 100, height: 50, color: 123 })).toBe(false); // color is number
      expect(isCensorBox({ x: NaN, y: 20, width: 100, height: 50, color: '#fff' })).toBe(false); // x is NaN
    });

    it('rejects CensorBox with empty color string', () => {
      const invalidBox = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        color: '',
      };
      expect(isCensorBox(invalidBox)).toBe(false);
    });

    it('rejects null', () => {
      expect(isCensorBox(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isCensorBox(undefined)).toBe(false);
    });

    it('rejects primitives', () => {
      expect(isCensorBox(123)).toBe(false);
      expect(isCensorBox('string')).toBe(false);
      expect(isCensorBox(true)).toBe(false);
    });

    it('rejects arrays', () => {
      expect(isCensorBox([10, 20, 100, 50, '#fff'])).toBe(false);
    });
  });

  describe('isSlide', () => {
    it('accepts valid Slide objects', () => {
      const validSlide = {
        imageUrl: 'data:image/png;base64,abc123',
        answer: 'The Matrix',
        censorBoxes: [],
      };
      expect(isSlide(validSlide)).toBe(true);
    });

    it('accepts Slide with empty answer', () => {
      const validSlide = {
        imageUrl: 'data:image/png;base64,abc123',
        answer: '',
        censorBoxes: [],
      };
      expect(isSlide(validSlide)).toBe(true);
    });

    it('accepts Slide with censor boxes', () => {
      const validSlide = {
        imageUrl: 'data:image/png;base64,abc123',
        answer: 'Answer',
        censorBoxes: [
          {
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            color: '#ff0000',
          },
        ],
      };
      expect(isSlide(validSlide)).toBe(true);
    });

    it('accepts Slide with multiple censor boxes', () => {
      const validSlide = {
        imageUrl: 'data:image/jpeg;base64,xyz789',
        answer: 'Multiple boxes',
        censorBoxes: [
          { x: 10, y: 20, width: 100, height: 50, color: '#ff0000' },
          { x: 50, y: 60, width: 80, height: 40, color: '#00ff00' },
        ],
      };
      expect(isSlide(validSlide)).toBe(true);
    });

    it('rejects Slide with invalid imageUrl (not data: URL)', () => {
      const invalidSlide = {
        imageUrl: 'https://example.com/image.png',
        answer: 'Answer',
        censorBoxes: [],
      };
      expect(isSlide(invalidSlide)).toBe(false);
    });

    it('rejects Slide with empty imageUrl', () => {
      const invalidSlide = {
        imageUrl: '',
        answer: 'Answer',
        censorBoxes: [],
      };
      expect(isSlide(invalidSlide)).toBe(false);
    });

    it('rejects Slide with missing imageUrl', () => {
      const invalidSlide = {
        answer: 'Answer',
        censorBoxes: [],
      };
      expect(isSlide(invalidSlide)).toBe(false);
    });

    it('rejects Slide with missing answer', () => {
      const invalidSlide = {
        imageUrl: 'data:image/png;base64,abc123',
        censorBoxes: [],
      };
      expect(isSlide(invalidSlide)).toBe(false);
    });

    it('rejects Slide with missing censorBoxes', () => {
      const invalidSlide = {
        imageUrl: 'data:image/png;base64,abc123',
        answer: 'Answer',
      };
      expect(isSlide(invalidSlide)).toBe(false);
    });

    it('rejects Slide with non-array censorBoxes', () => {
      const invalidSlide = {
        imageUrl: 'data:image/png;base64,abc123',
        answer: 'Answer',
        censorBoxes: 'not an array',
      };
      expect(isSlide(invalidSlide)).toBe(false);
    });

    it('rejects Slide with invalid censor box', () => {
      const invalidSlide = {
        imageUrl: 'data:image/png;base64,abc123',
        answer: 'Answer',
        censorBoxes: [
          {
            x: -10, // Invalid: negative
            y: 20,
            width: 100,
            height: 50,
            color: '#ff0000',
          },
        ],
      };
      expect(isSlide(invalidSlide)).toBe(false);
    });

    it('rejects Slide with wrong types', () => {
      expect(isSlide({ imageUrl: 123, answer: 'Answer', censorBoxes: [] })).toBe(false); // imageUrl is number
      expect(isSlide({ imageUrl: 'data:image/png;base64,abc', answer: 123, censorBoxes: [] })).toBe(
        false
      ); // answer is number
    });

    it('rejects null', () => {
      expect(isSlide(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isSlide(undefined)).toBe(false);
    });

    it('rejects primitives', () => {
      expect(isSlide(123)).toBe(false);
      expect(isSlide('string')).toBe(false);
    });
  });

  describe('isCategory', () => {
    it('accepts valid Category objects', () => {
      const validCategory = {
        name: 'Movies',
        slides: [
          {
            imageUrl: 'data:image/png;base64,abc123',
            answer: 'The Matrix',
            censorBoxes: [],
          },
        ],
      };
      expect(isCategory(validCategory)).toBe(true);
    });

    it('accepts Category with multiple slides', () => {
      const validCategory = {
        name: 'Movies',
        slides: [
          {
            imageUrl: 'data:image/png;base64,abc123',
            answer: 'The Matrix',
            censorBoxes: [],
          },
          {
            imageUrl: 'data:image/jpeg;base64,def456',
            answer: 'Inception',
            censorBoxes: [{ x: 10, y: 20, width: 100, height: 50, color: '#ff0000' }],
          },
        ],
      };
      expect(isCategory(validCategory)).toBe(true);
    });

    it('rejects Category with empty name', () => {
      const invalidCategory = {
        name: '',
        slides: [
          {
            imageUrl: 'data:image/png;base64,abc123',
            answer: 'Answer',
            censorBoxes: [],
          },
        ],
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with whitespace-only name', () => {
      const invalidCategory = {
        name: '   ',
        slides: [
          {
            imageUrl: 'data:image/png;base64,abc123',
            answer: 'Answer',
            censorBoxes: [],
          },
        ],
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with missing name', () => {
      const invalidCategory = {
        slides: [
          {
            imageUrl: 'data:image/png;base64,abc123',
            answer: 'Answer',
            censorBoxes: [],
          },
        ],
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with empty slides array', () => {
      const invalidCategory = {
        name: 'Movies',
        slides: [],
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with missing slides', () => {
      const invalidCategory = {
        name: 'Movies',
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with non-array slides', () => {
      const invalidCategory = {
        name: 'Movies',
        slides: 'not an array',
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with invalid slide', () => {
      const invalidCategory = {
        name: 'Movies',
        slides: [
          {
            imageUrl: 'not-a-data-url', // Invalid
            answer: 'Answer',
            censorBoxes: [],
          },
        ],
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with mix of valid and invalid slides', () => {
      const invalidCategory = {
        name: 'Movies',
        slides: [
          {
            imageUrl: 'data:image/png;base64,abc123',
            answer: 'Valid',
            censorBoxes: [],
          },
          {
            imageUrl: 'invalid-url', // Invalid
            answer: 'Invalid',
            censorBoxes: [],
          },
        ],
      };
      expect(isCategory(invalidCategory)).toBe(false);
    });

    it('rejects Category with wrong types', () => {
      expect(isCategory({ name: 123, slides: [] })).toBe(false); // name is number
      expect(
        isCategory({
          name: 'Movies',
          slides: 'not array',
        })
      ).toBe(false); // slides is string
    });

    it('rejects null', () => {
      expect(isCategory(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isCategory(undefined)).toBe(false);
    });

    it('rejects primitives', () => {
      expect(isCategory(123)).toBe(false);
      expect(isCategory('string')).toBe(false);
    });

    it('rejects arrays', () => {
      expect(isCategory([])).toBe(false);
    });
  });
});
