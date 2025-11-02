/**
 * Tests for IndexedDB storage abstraction layer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllContestants,
  addContestant,
  updateContestant,
  deleteContestant,
  clearAllContestants,
} from './indexedDB';
import type { Contestant } from '@types';

describe('indexedDB', () => {
  // Sample test data
  const contestant1: Contestant = {
    id: 'test-1',
    name: 'Alice',
    category: {
      name: 'Math',
      slides: [
        {
          imageUrl: 'data:image/jpeg;base64,test',
          answer: '42',
          censorBoxes: [],
        },
      ],
    },
    wins: 0,
    eliminated: false,
  };

  const contestant2: Contestant = {
    id: 'test-2',
    name: 'Bob',
    category: {
      name: 'Science',
      slides: [
        {
          imageUrl: 'data:image/jpeg;base64,test2',
          answer: 'H2O',
          censorBoxes: [],
        },
      ],
    },
    wins: 2,
    eliminated: false,
  };

  beforeEach(async () => {
    // Clear database before each test
    await clearAllContestants();
  });

  it('should start with empty database', async () => {
    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toEqual([]);
  });

  it('should add contestant to IndexedDB', async () => {
    await addContestant(contestant1);

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toHaveLength(1);
    expect(contestants[0]).toEqual(contestant1);
  });

  it('should add multiple contestants', async () => {
    await addContestant(contestant1);
    await addContestant(contestant2);

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toHaveLength(2);
    expect(contestants).toContainEqual(contestant1);
    expect(contestants).toContainEqual(contestant2);
  });

  it('should retrieve all contestants', async () => {
    await addContestant(contestant1);
    await addContestant(contestant2);

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toHaveLength(2);
  });

  it('should update existing contestant', async () => {
    await addContestant(contestant1);

    const updated: Contestant = {
      ...contestant1,
      wins: 5,
      eliminated: true,
    };

    await updateContestant(updated);

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toHaveLength(1);
    expect(contestants[0]?.wins).toBe(5);
    expect(contestants[0]?.eliminated).toBe(true);
  });

  it('should delete contestant by id', async () => {
    await addContestant(contestant1);
    await addContestant(contestant2);

    await deleteContestant('test-1');

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toHaveLength(1);
    expect(contestants[0]?.id).toBe('test-2');
  });

  it('should clear all contestants', async () => {
    await addContestant(contestant1);
    await addContestant(contestant2);

    await clearAllContestants();

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toEqual([]);
  });

  it('should handle adding contestant without required id field', async () => {
    const invalidContestant = {
      name: 'Invalid',
      category: { name: 'Test', slides: [] },
      wins: 0,
      eliminated: false,
    } as unknown as Contestant;

    // This should throw an error because id is missing
    await expect(addContestant(invalidContestant)).rejects.toThrow();
  });

  it('should handle deleting non-existent contestant', async () => {
    // Should not throw error when deleting non-existent contestant
    await expect(deleteContestant('non-existent')).resolves.not.toThrow();

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toEqual([]);
  });

  it('should handle concurrent add operations', async () => {
    // Add multiple contestants concurrently
    await Promise.all([addContestant(contestant1), addContestant(contestant2)]);

    const contestants = await getAllContestants<Contestant>();
    expect(contestants).toHaveLength(2);
  });

  it('should preserve contestant data integrity', async () => {
    const complexContestant: Contestant = {
      id: 'test-complex',
      name: 'Charlie',
      category: {
        name: 'Geography',
        slides: [
          {
            imageUrl: 'data:image/jpeg;base64,ABC123',
            answer: 'Paris',
            censorBoxes: [
              { x: 10, y: 20, width: 30, height: 40, color: '#FF0000' },
              { x: 50, y: 60, width: 70, height: 80, color: '#00FF00' },
            ],
          },
          {
            imageUrl: 'data:image/jpeg;base64,DEF456',
            answer: 'London',
            censorBoxes: [],
          },
        ],
      },
      wins: 3,
      eliminated: false,
    };

    await addContestant(complexContestant);

    const contestants = await getAllContestants<Contestant>();
    expect(contestants[0]).toEqual(complexContestant);
    expect(contestants[0]?.category.slides).toHaveLength(2);
    expect(contestants[0]?.category.slides[0]?.censorBoxes).toHaveLength(2);
  });
});
