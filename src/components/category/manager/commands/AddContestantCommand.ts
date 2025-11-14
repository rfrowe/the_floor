import { nanoid } from 'nanoid';
import { addContestant, deleteContestant } from '@/storage/indexedDB';
import type { Contestant } from '@/types';
import type { Command } from '@/components/common/Command';
import type { AddCategoryCommand } from './AddCategoryCommand';

export class AddContestantCommand implements Command {
  private contestantId: string | null = null;
  private executed = false;
  private contestantData: Omit<Contestant, 'id' | 'categoryId'>;
  private categoryCommand: AddCategoryCommand;

  constructor(
    contestantData: Omit<Contestant, 'id' | 'categoryId'>,
    categoryCommand: AddCategoryCommand
  ) {
    this.contestantData = contestantData;
    this.categoryCommand = categoryCommand;
  }

  async execute(): Promise<void> {
    if (this.executed) return;

    const categoryId = this.categoryCommand.getCategoryId();
    this.contestantId = nanoid();

    await addContestant({
      ...this.contestantData,
      id: this.contestantId,
      categoryId,
    });
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed || !this.contestantId) return;

    await deleteContestant(this.contestantId);
    this.executed = false;
  }

  describe(): string {
    return `Add contestant "${this.contestantData.name}"`;
  }
}
