/**
 * Tests for categoryToFileName / slugifyCategoryName — building a safe,
 * slugified download filename from a category name.
 */

import { describe, it, expect } from 'vitest';
import { categoryToFileName, slugifyCategoryName } from './categoryToFileName';

describe('slugifyCategoryName', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugifyCategoryName('The Real Housewives')).toBe('the-real-housewives');
  });

  it('strips punctuation and collapses separators into single hyphens', () => {
    expect(slugifyCategoryName('Cats & Dogs!!!')).toBe('cats-dogs');
    expect(slugifyCategoryName('A  -  B')).toBe('a-b');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugifyCategoryName('  Hello World  ')).toBe('hello-world');
    expect(slugifyCategoryName('***Wild***')).toBe('wild');
  });

  it('strips diacritics', () => {
    expect(slugifyCategoryName('Pokémon Café')).toBe('pokemon-cafe');
  });

  it('keeps digits', () => {
    expect(slugifyCategoryName('Top 100 Films')).toBe('top-100-films');
  });

  it('falls back when the name has no usable characters', () => {
    expect(slugifyCategoryName('')).toBe('category');
    expect(slugifyCategoryName('   ')).toBe('category');
    expect(slugifyCategoryName('!!!')).toBe('category');
    expect(slugifyCategoryName('   ', 'fallback')).toBe('fallback');
  });
});

describe('categoryToFileName', () => {
  it('appends a .json extension to the slug', () => {
    expect(categoryToFileName('The Real Housewives')).toBe('the-real-housewives.json');
  });

  it('uses the fallback slug for empty names', () => {
    expect(categoryToFileName('')).toBe('category.json');
  });
});
