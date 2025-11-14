/**
 * AddCategoryCommand Tests
 *
 * Tests the AddCategoryCommand implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddCategoryCommand } from './AddCategoryCommand';
import type { StoredCategory } from '@/types';
import * as indexedDB from '@/storage/indexedDB';

// Mock the storage module
vi.mock('@/storage/indexedDB', () => ({
  addCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'test-id-123',
}));

describe('AddCategoryCommand', () => {
  const mockCategoryData: Omit<StoredCategory, 'id'> = {
    name: 'Test Category',
    slides: [
      {
        answer: 'Test Answer',
        imageUrl: 'https://example.com/image.jpg',
        censorBoxes: [],
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    sizeInBytes: 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should add category to storage with generated ID', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();

      expect(indexedDB.addCategory).toHaveBeenCalledWith({
        ...mockCategoryData,
        id: 'test-id-123',
      });
      expect(indexedDB.addCategory).toHaveBeenCalledTimes(1);
    });

    it('should only execute once (idempotent)', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();
      await command.execute();
      await command.execute();

      expect(indexedDB.addCategory).toHaveBeenCalledTimes(1);
    });

    it('should set categoryId after execution', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();

      expect(command.getCategoryId()).toBe('test-id-123');
    });

    it('should handle errors during execution', async () => {
      const error = new Error('Database error');
      vi.mocked(indexedDB.addCategory).mockRejectedValueOnce(error);

      const command = new AddCategoryCommand(mockCategoryData);

      await expect(command.execute()).rejects.toThrow('Database error');
      expect(indexedDB.addCategory).toHaveBeenCalledTimes(1);
    });
  });

  describe('undo', () => {
    it('should remove category from storage', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      // Execute first
      await command.execute();

      // Then undo
      await command.undo();

      expect(indexedDB.deleteCategory).toHaveBeenCalledWith('test-id-123');
      expect(indexedDB.deleteCategory).toHaveBeenCalledTimes(1);
    });

    it('should not undo if never executed', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.undo();

      expect(indexedDB.deleteCategory).not.toHaveBeenCalled();
    });

    it('should handle undo errors gracefully', async () => {
      const error = new Error('Remove failed');
      vi.mocked(indexedDB.deleteCategory).mockRejectedValueOnce(error);

      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();
      await expect(command.undo()).rejects.toThrow('Remove failed');

      expect(indexedDB.deleteCategory).toHaveBeenCalledTimes(1);
    });

    it('should reset executed state after undo', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();
      expect(indexedDB.addCategory).toHaveBeenCalledTimes(1);

      await command.undo();

      // Should be able to execute again after undo
      await command.execute();
      expect(indexedDB.addCategory).toHaveBeenCalledTimes(2);
    });

    it('should allow multiple undo calls (idempotent)', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();

      await command.undo();
      await command.undo();
      await command.undo();

      expect(indexedDB.deleteCategory).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategoryId', () => {
    it('should throw error if called before execute', () => {
      const command = new AddCategoryCommand(mockCategoryData);

      expect(() => command.getCategoryId()).toThrow(
        'Category not yet created - execute command first'
      );
    });

    it('should return category ID after execute', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();

      expect(command.getCategoryId()).toBe('test-id-123');
    });

    it('should still return ID after undo', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      await command.execute();
      const id = command.getCategoryId();

      await command.undo();

      // ID is still accessible even after undo
      expect(command.getCategoryId()).toBe(id);
    });
  });

  describe('describe', () => {
    it('should return description with category name', () => {
      const command = new AddCategoryCommand(mockCategoryData);

      expect(command.describe()).toBe('Add category "Test Category"');
    });

    it('should handle special characters in category name', () => {
      const specialData: Omit<StoredCategory, 'id'> = {
        ...mockCategoryData,
        name: 'Test "Category" with <special> & chars',
      };

      const command = new AddCategoryCommand(specialData);

      expect(command.describe()).toBe('Add category "Test "Category" with <special> & chars"');
    });

    it('should handle empty category name', () => {
      const emptyNameData: Omit<StoredCategory, 'id'> = {
        ...mockCategoryData,
        name: '',
      };

      const command = new AddCategoryCommand(emptyNameData);

      expect(command.describe()).toBe('Add category ""');
    });
  });

  describe('integration scenarios', () => {
    it('should support execute-undo-execute cycle', async () => {
      const command = new AddCategoryCommand(mockCategoryData);

      // First execution
      await command.execute();
      expect(indexedDB.addCategory).toHaveBeenCalledTimes(1);
      const firstId = command.getCategoryId();

      // Undo
      await command.undo();
      expect(indexedDB.deleteCategory).toHaveBeenCalledWith(firstId);

      // Re-execute - should get same ID
      await command.execute();
      expect(indexedDB.addCategory).toHaveBeenCalledTimes(2);
      expect(command.getCategoryId()).toBe(firstId);
    });

    it('should handle concurrent commands independently', async () => {
      const command1 = new AddCategoryCommand({
        ...mockCategoryData,
        name: 'Category 1',
      });

      const command2 = new AddCategoryCommand({
        ...mockCategoryData,
        name: 'Category 2',
      });

      // Execute both
      await Promise.all([command1.execute(), command2.execute()]);

      expect(indexedDB.addCategory).toHaveBeenCalledTimes(2);

      // Undo one
      await command1.undo();
      expect(indexedDB.deleteCategory).toHaveBeenCalledTimes(1);

      // Other should still be valid
      expect(command2.getCategoryId()).toBe('test-id-123');
    });

    it('should preserve category data integrity', async () => {
      const specificData: Omit<StoredCategory, 'id'> = {
        name: 'Complex Category',
        slides: [
          {
            answer: 'A1',
            imageUrl: 'img1.jpg',
            censorBoxes: [],
          },
          {
            answer: 'A2',
            imageUrl: 'img2.jpg',
            censorBoxes: [],
          },
        ],
        createdAt: '2024-12-01T10:30:00Z',
        thumbnailUrl: 'thumb.jpg',
        sizeInBytes: 2048,
      };

      const command = new AddCategoryCommand(specificData);

      await command.execute();

      // Verify exact data passed to storage
      expect(indexedDB.addCategory).toHaveBeenCalledWith({
        ...specificData,
        id: 'test-id-123',
      });
    });
  });
});
