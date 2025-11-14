import { nanoid } from 'nanoid';
import { addCategory, deleteCategory } from '@/storage/indexedDB';
import type { StoredCategory } from '@/types';
import type { Command } from '@/components/common/Command';

export class AddCategoryCommand implements Command {
  private categoryId: string | null = null;
  private executed = false;
  private categoryData: Omit<StoredCategory, 'id'>;

  constructor(categoryData: Omit<StoredCategory, 'id'>) {
    this.categoryData = categoryData;
  }

  async execute(): Promise<void> {
    if (this.executed) return;

    this.categoryId = nanoid();
    await addCategory({
      ...this.categoryData,
      id: this.categoryId,
    });
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed || !this.categoryId) return;

    await deleteCategory(this.categoryId);
    this.executed = false;
  }

  getCategoryId(): string {
    if (!this.categoryId) {
      throw new Error('Category not yet created - execute command first');
    }
    return this.categoryId;
  }

  describe(): string {
    return `Add category "${this.categoryData.name}"`;
  }
}
