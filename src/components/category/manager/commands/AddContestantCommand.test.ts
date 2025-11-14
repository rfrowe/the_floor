/**
 * AddContestantCommand Tests
 *
 * Tests the AddContestantCommand implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddContestantCommand } from './AddContestantCommand';
import { AddCategoryCommand } from './AddCategoryCommand';
import type { Contestant } from '@/types';
import * as indexedDB from '@/storage/indexedDB';

// Mock the storage module
vi.mock('@/storage/indexedDB', () => ({
  addContestant: vi.fn(),
  deleteContestant: vi.fn(),
  addCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

// Mock nanoid
let nanoidCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => {
    const ids = ['category-id-123', 'contestant-id-456', 'new-id-789'];
    return ids[nanoidCounter++ % ids.length] ?? 'new-id-789';
  }),
}));

describe('AddContestantCommand', () => {
  const mockContestantData: Omit<Contestant, 'id' | 'categoryId'> = {
    name: 'Test Contestant',
    category: {
      name: 'Test Category',
      slides: [
        {
          answer: 'Test Answer',
          imageUrl: 'https://example.com/image.jpg',
          censorBoxes: [],
        },
      ],
    },
    wins: 0,
    eliminated: false,
  };

  let mockCategoryCommand: AddCategoryCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset nanoid counter for each test
    nanoidCounter = 0;
    vi.mocked(indexedDB.addCategory).mockResolvedValue();
    vi.mocked(indexedDB.addContestant).mockResolvedValue();

    mockCategoryCommand = new AddCategoryCommand({
      name: 'Test Category',
      slides: mockContestantData.category.slides,
      createdAt: '2024-01-01T00:00:00Z',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      sizeInBytes: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should add contestant with category ID from category command', async () => {
      // Execute category command first
      await mockCategoryCommand.execute();

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await command.execute();

      expect(indexedDB.addContestant).toHaveBeenCalledWith({
        ...mockContestantData,
        id: 'contestant-id-456',
        categoryId: 'category-id-123',
      });
      expect(indexedDB.addContestant).toHaveBeenCalledTimes(1);
    });

    it('should throw error if category command not executed', async () => {
      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await expect(command.execute()).rejects.toThrow(
        'Category not yet created - execute command first'
      );
      expect(indexedDB.addContestant).not.toHaveBeenCalled();
    });

    it('should only execute once (idempotent)', async () => {
      await mockCategoryCommand.execute();

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await command.execute();
      await command.execute();
      await command.execute();

      expect(indexedDB.addContestant).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during execution', async () => {
      await mockCategoryCommand.execute();

      const error = new Error('Database error');
      vi.mocked(indexedDB.addContestant).mockRejectedValueOnce(error);

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await expect(command.execute()).rejects.toThrow('Database error');
      expect(indexedDB.addContestant).toHaveBeenCalledTimes(1);
    });
  });

  describe('undo', () => {
    it('should remove contestant from storage', async () => {
      await mockCategoryCommand.execute();

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      // Execute first
      await command.execute();

      // Then undo
      await command.undo();

      expect(indexedDB.deleteContestant).toHaveBeenCalledWith('contestant-id-456');
      expect(indexedDB.deleteContestant).toHaveBeenCalledTimes(1);
    });

    it('should not undo if never executed', async () => {
      await mockCategoryCommand.execute();

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await command.undo();

      expect(indexedDB.deleteContestant).not.toHaveBeenCalled();
    });

    it('should handle undo errors gracefully', async () => {
      await mockCategoryCommand.execute();

      const error = new Error('Remove failed');
      vi.mocked(indexedDB.deleteContestant).mockRejectedValueOnce(error);

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await command.execute();
      await expect(command.undo()).rejects.toThrow('Remove failed');

      expect(indexedDB.deleteContestant).toHaveBeenCalledTimes(1);
    });

    it('should reset executed state after undo', async () => {
      await mockCategoryCommand.execute();

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await command.execute();
      expect(indexedDB.addContestant).toHaveBeenCalledTimes(1);

      await command.undo();

      // Should be able to execute again after undo
      await command.execute();
      expect(indexedDB.addContestant).toHaveBeenCalledTimes(2);
    });

    it('should allow multiple undo calls (idempotent)', async () => {
      await mockCategoryCommand.execute();

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      await command.execute();

      await command.undo();
      await command.undo();
      await command.undo();

      expect(indexedDB.deleteContestant).toHaveBeenCalledTimes(1);
    });
  });

  describe('describe', () => {
    it('should return description with contestant name', () => {
      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      expect(command.describe()).toBe('Add contestant "Test Contestant"');
    });

    it('should handle special characters in contestant name', () => {
      const specialData: Omit<Contestant, 'id' | 'categoryId'> = {
        ...mockContestantData,
        name: 'Contestant "with" <special> & chars',
      };

      const command = new AddContestantCommand(specialData, mockCategoryCommand);

      expect(command.describe()).toBe('Add contestant "Contestant "with" <special> & chars"');
    });

    it('should handle empty contestant name', () => {
      const emptyNameData: Omit<Contestant, 'id' | 'categoryId'> = {
        ...mockContestantData,
        name: '',
      };

      const command = new AddContestantCommand(emptyNameData, mockCategoryCommand);

      expect(command.describe()).toBe('Add contestant ""');
    });
  });

  describe('integration scenarios', () => {
    it('should work with category command in sequence', async () => {
      // Execute category command
      await mockCategoryCommand.execute();
      expect(indexedDB.addCategory).toHaveBeenCalledTimes(1);

      // Execute contestant command
      const contestantCommand = new AddContestantCommand(mockContestantData, mockCategoryCommand);
      await contestantCommand.execute();
      expect(indexedDB.addContestant).toHaveBeenCalledTimes(1);

      // Verify contestant has correct category ID
      expect(indexedDB.addContestant).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'category-id-123',
        })
      );
    });

    it('should support execute-undo-execute cycle', async () => {
      await mockCategoryCommand.execute();

      const command = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      // First execution
      await command.execute();
      expect(indexedDB.addContestant).toHaveBeenCalledTimes(1);

      // Undo
      await command.undo();
      expect(indexedDB.deleteContestant).toHaveBeenCalledTimes(1);

      // Re-execute
      await command.execute();
      expect(indexedDB.addContestant).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple contestants for same category', async () => {
      await mockCategoryCommand.execute();

      const contestant1Command = new AddContestantCommand(
        { ...mockContestantData, name: 'Contestant 1' },
        mockCategoryCommand
      );

      const contestant2Command = new AddContestantCommand(
        { ...mockContestantData, name: 'Contestant 2' },
        mockCategoryCommand
      );

      // Execute both
      await contestant1Command.execute();
      await contestant2Command.execute();

      expect(indexedDB.addContestant).toHaveBeenCalledTimes(2);

      // Both should have same category ID
      expect(indexedDB.addContestant).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          categoryId: 'category-id-123',
          name: 'Contestant 1',
        })
      );
      expect(indexedDB.addContestant).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          categoryId: 'category-id-123',
          name: 'Contestant 2',
        })
      );
    });

    it('should preserve contestant data integrity', async () => {
      await mockCategoryCommand.execute();

      const specificData: Omit<Contestant, 'id' | 'categoryId'> = {
        name: 'Alice Smith',
        category: {
          name: 'Science',
          slides: [
            {
              answer: 'Water',
              imageUrl: 'science.jpg',
              censorBoxes: [],
            },
          ],
        },
        wins: 3,
        eliminated: false,
      };

      const command = new AddContestantCommand(specificData, mockCategoryCommand);

      await command.execute();

      // Verify exact data passed to storage
      expect(indexedDB.addContestant).toHaveBeenCalledWith({
        ...specificData,
        id: 'contestant-id-456',
        categoryId: 'category-id-123',
      });
    });

    it('should handle undo in command stack scenario', async () => {
      // Simulate ViewStack command execution
      const commands: (AddCategoryCommand | AddContestantCommand)[] = [mockCategoryCommand];

      // Execute category
      await mockCategoryCommand.execute();

      // Add contestant command
      const contestantCommand = new AddContestantCommand(mockContestantData, mockCategoryCommand);
      commands.push(contestantCommand);

      // Execute contestant
      await contestantCommand.execute();

      // Simulate popping view - undo in reverse order
      for (let i = commands.length - 1; i >= 0; i--) {
        const command = commands[i];
        if (command) {
          await command.undo();
        }
      }

      expect(indexedDB.deleteContestant).toHaveBeenCalledWith('contestant-id-456');
      expect(indexedDB.deleteCategory).toHaveBeenCalledWith('category-id-123');
    });

    it('should handle category not executed error properly', async () => {
      // Don't execute category command
      const contestantCommand = new AddContestantCommand(mockContestantData, mockCategoryCommand);

      // Try to execute contestant - should fail
      await expect(contestantCommand.execute()).rejects.toThrow(
        'Category not yet created - execute command first'
      );

      // Storage should not be touched
      expect(indexedDB.addContestant).not.toHaveBeenCalled();
    });
  });
});
