/**
 * Shared demo utilities and data for component demos
 * Includes Baseball.json singleton loader and fake data generators
 */

import { useState, useEffect } from 'react';
import { fetchSampleCategory } from '@utils/sampleCategories';
import type { Slide } from '@types';

// Singleton cache for baseball data
let cachedBaseballSlides: Slide[] | null = null;
let loadingPromise: Promise<Slide[]> | null = null;

async function loadBaseballSlides(): Promise<Slide[]> {
  if (cachedBaseballSlides) {
    return cachedBaseballSlides;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = fetchSampleCategory('Baseball.json')
    .then(({ category }) => {
      cachedBaseballSlides = category.slides;
      loadingPromise = null;
      return category.slides;
    })
    .catch((error: unknown) => {
      console.error('Failed to load Baseball category:', error);
      loadingPromise = null;
      return [];
    });

  return loadingPromise;
}

export function useSharedBaseballData() {
  const [slides, setSlides] = useState<Slide[] | null>(cachedBaseballSlides);
  const [loading, setLoading] = useState(!cachedBaseballSlides);

  useEffect(() => {
    if (!cachedBaseballSlides) {
      void loadBaseballSlides().then((loadedSlides) => {
        setSlides(loadedSlides);
        setLoading(false);
      });
    }
  }, []);

  return { slides, loading };
}

// Shared fake data for demos
export const randomNames = [
  'Jordan Taylor',
  'Sam Rivera',
  'Morgan Chen',
  'Casey Williams',
  'Riley Kim',
  'Alex Martinez',
  'Jamie Lee',
  'Taylor Swift',
  'Cameron Davis',
  'Quinn Johnson',
];

export const randomCategories = [
  'Sports',
  'Music',
  'Movies',
  'Science',
  'History',
  'Geography',
  'Literature',
  'Art',
  'Technology',
  'Food',
];

export function getRandomName(): string {
  return randomNames[Math.floor(Math.random() * randomNames.length)] ?? 'New Contestant';
}

export function getRandomCategory(): string {
  return randomCategories[Math.floor(Math.random() * randomCategories.length)] ?? 'General';
}
