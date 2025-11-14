/**
 * ImportCommand - Command pattern for importing categories with undo support
 */

import { createLogger } from '@utils/logger';
import type { Command } from '@components/common/Command';

const logger = createLogger('ImportCommand');

export interface ImportResult {
  categoryId: string;
  contestantId?: string;
}

export class ImportCommand implements Command {
  result: ImportResult | null = null;
  importFn: () => Promise<ImportResult>;
  undoFn: (result: ImportResult) => Promise<void>;

  constructor(
    importFn: () => Promise<ImportResult>,
    undoFn: (result: ImportResult) => Promise<void>
  ) {
    this.importFn = importFn;
    this.undoFn = undoFn;
  }

  async execute(): Promise<void> {
    if (this.result) {
      // Already executed - idempotent
      return;
    }

    this.result = await this.importFn();
    logger.success('ImportCommand executed:', this.result);
  }

  async undo(): Promise<void> {
    if (!this.result) {
      // Nothing to undo
      return;
    }

    await this.undoFn(this.result);
    logger.info('ImportCommand undone:', this.result);
    this.result = null; // Reset so it can be re-executed if needed
  }

  describe(): string {
    return 'Import category';
  }
}
