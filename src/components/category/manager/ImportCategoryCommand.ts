/**
 * ImportCategoryCommand
 *
 * Command for importing a category (and optionally a contestant).
 * Handles both execute (save to DB) and undo (delete from DB).
 */

import type { Category } from '@types';
import type { Command } from '@components/common/Command';

export class ImportCategoryCommand implements Command {
  private categoryId: string | null;
  private contestantId: string | null;
  private data: { name: string; category: Category };
  private onImport: (data: {
    name: string;
    category: Category;
  }) => Promise<{ categoryId: string; contestantId?: string }>;
  private onUndo: (categoryId: string, contestantId?: string) => Promise<void>;

  constructor(
    data: { name: string; category: Category },
    onImport: (data: {
      name: string;
      category: Category;
    }) => Promise<{ categoryId: string; contestantId?: string }>,
    onUndo: (categoryId: string, contestantId?: string) => Promise<void>
  ) {
    this.categoryId = null;
    this.contestantId = null;
    this.data = data;
    this.onImport = onImport;
    this.onUndo = onUndo;
  }

  updateData(contestantName: string, categoryName: string): void {
    this.data = {
      name: contestantName,
      category: { ...this.data.category, name: categoryName },
    };
  }

  async execute(): Promise<void> {
    // Guard against duplicate execution (idempotent)
    if (this.categoryId !== null) {
      return;
    }

    const result = await this.onImport(this.data);
    this.categoryId = result.categoryId;
    this.contestantId = result.contestantId ?? null;
  }

  async undo(): Promise<void> {
    if (this.categoryId) {
      await this.onUndo(this.categoryId, this.contestantId ?? undefined);
      // Reset execution state so command can be re-executed after undo
      this.categoryId = null;
      this.contestantId = null;
    }
  }

  describe(): string {
    return `Import category: ${this.data.category.name}${this.data.name ? ` (contestant: ${this.data.name})` : ''}`;
  }
}
