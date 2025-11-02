/**
 * Tests for JSON import utility
 */

import { describe, it, expect } from 'vitest';
import { loadCategoryJSON, createContestantFromCategory, JSONImportError } from './jsonImport';
import type { Category } from '@types';

// Helper to create a File-like object from JSON data
function createJSONFile(data: unknown, filename = 'test.json'): File {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const file = new File([blob], filename, { type: 'application/json' });

  // Ensure text() method is available for the test environment (jsdom polyfill)
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(json),
    writable: true,
    configurable: true,
  });

  return file;
}

describe('loadCategoryJSON', () => {
  it('should load valid category JSON', async () => {
    const validData = {
      name: 'Movies',
      slides: [
        {
          imageUrl: 'data:image/png;base64,abc123',
          answer: 'The Matrix',
          censorBoxes: [],
        },
      ],
    };

    const file = createJSONFile(validData);
    const result = await loadCategoryJSON(file);

    expect(result).toEqual(validData);
  });

  it('should load category from wrapped format (with category field)', async () => {
    const wrappedData = {
      category: {
        name: 'Movies',
        slides: [
          {
            imageUrl: 'data:image/png;base64,abc123',
            answer: 'The Matrix',
            censorBoxes: [],
          },
        ],
      },
      metadata: {
        contestantName: 'John',
      },
    };

    const file = createJSONFile(wrappedData);
    const result = await loadCategoryJSON(file);

    expect(result.name).toBe('Movies');
    expect(result.slides).toHaveLength(1);
  });

  it('should validate censor boxes with positive numbers', async () => {
    const validData = {
      name: 'Movies',
      slides: [
        {
          imageUrl: 'data:image/png;base64,abc123',
          answer: 'The Matrix',
          censorBoxes: [
            {
              x: 10.5,
              y: 20.3,
              width: 30.0,
              height: 15.0,
              color: '#ff0000',
            },
          ],
        },
      ],
    };

    const file = createJSONFile(validData);
    const result = await loadCategoryJSON(file);

    expect(result.slides[0]?.censorBoxes).toHaveLength(1);
    expect(result.slides[0]?.censorBoxes[0]?.x).toBe(10.5);
  });

  it('should reject invalid JSON', async () => {
    const invalidJSON = 'invalid json {';
    const blob = new Blob([invalidJSON], { type: 'application/json' });
    const file = new File([blob], 'test.json', { type: 'application/json' });

    // Ensure text() method is available for the test environment (jsdom polyfill)
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(invalidJSON),
      writable: true,
      configurable: true,
    });

    await expect(loadCategoryJSON(file)).rejects.toThrow(JSONImportError);
    await expect(loadCategoryJSON(file)).rejects.toThrow('Failed to parse JSON');
  });

  it('should reject category without name', async () => {
    const invalidData = {
      slides: [
        {
          imageUrl: 'data:image/png;base64,abc123',
          answer: 'The Matrix',
          censorBoxes: [],
        },
      ],
    };

    const file = createJSONFile(invalidData);
    await expect(loadCategoryJSON(file)).rejects.toThrow(JSONImportError);
  });

  it('should reject category with empty slides array', async () => {
    const invalidData = {
      name: 'Movies',
      slides: [],
    };

    const file = createJSONFile(invalidData);
    await expect(loadCategoryJSON(file)).rejects.toThrow(JSONImportError);
  });

  it('should reject slides without valid imageUrl', async () => {
    const invalidData = {
      name: 'Movies',
      slides: [
        {
          imageUrl: 'not-a-data-url',
          answer: 'The Matrix',
          censorBoxes: [],
        },
      ],
    };

    const file = createJSONFile(invalidData);
    await expect(loadCategoryJSON(file)).rejects.toThrow(JSONImportError);
  });

  it('should reject censor boxes with negative values', async () => {
    const invalidData = {
      name: 'Movies',
      slides: [
        {
          imageUrl: 'data:image/png;base64,abc123',
          answer: 'The Matrix',
          censorBoxes: [
            {
              x: -10,
              y: 20,
              width: 30,
              height: 15,
              color: '#ff0000',
            },
          ],
        },
      ],
    };

    const file = createJSONFile(invalidData);
    await expect(loadCategoryJSON(file)).rejects.toThrow(JSONImportError);
  });

  it('should accept slides with empty answer string', async () => {
    const validData = {
      name: 'Movies',
      slides: [
        {
          imageUrl: 'data:image/png;base64,abc123',
          answer: '',
          censorBoxes: [],
        },
      ],
    };

    const file = createJSONFile(validData);
    const result = await loadCategoryJSON(file);

    expect(result.slides[0]?.answer).toBe('');
  });

  it('should accept multiple slides', async () => {
    const validData = {
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
          censorBoxes: [
            {
              x: 5,
              y: 10,
              width: 20,
              height: 30,
              color: '#00ff00',
            },
          ],
        },
      ],
    };

    const file = createJSONFile(validData);
    const result = await loadCategoryJSON(file);

    expect(result.slides).toHaveLength(2);
    expect(result.slides[1]?.censorBoxes).toHaveLength(1);
  });
});

describe('createContestantFromCategory', () => {
  const mockCategory: Category = {
    name: 'Movies',
    slides: [
      {
        imageUrl: 'data:image/png;base64,abc123',
        answer: 'The Matrix',
        censorBoxes: [],
      },
    ],
  };

  it('should create contestant with valid data', () => {
    const contestant = createContestantFromCategory(mockCategory, 'John Doe');

    expect(contestant.name).toBe('John Doe');
    expect(contestant.category).toEqual(mockCategory);
    expect(contestant.wins).toBe(0);
    expect(contestant.eliminated).toBe(false);
  });

  it('should reject empty contestant name', () => {
    expect(() => createContestantFromCategory(mockCategory, '')).toThrow(JSONImportError);
    expect(() => createContestantFromCategory(mockCategory, '   ')).toThrow(JSONImportError);
  });

  it('should accept contestant name with whitespace that trims to valid', () => {
    const contestant = createContestantFromCategory(mockCategory, '  John Doe  ');
    expect(contestant.name).toBe('  John Doe  ');
  });
});
