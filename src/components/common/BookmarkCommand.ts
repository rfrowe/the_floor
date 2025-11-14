import type { Command } from './Command';

/**
 * BookmarkCommand is a special no-op command that marks a return point in the ViewStack.
 *
 * When commitAndReturn() is called, it searches backwards through the command stack
 * for a BookmarkCommand. If found, the view stack returns to the view immediately
 * after the bookmark, and the bookmark is consumed (removed from the stack).
 *
 * Use case: Multi-file imports where users should return to the original list view
 * after completing all imports, rather than backing through each intermediate view.
 */
export class BookmarkCommand implements Command {
  async execute(): Promise<void> {
    // No-op marker - does nothing when executed
  }

  async undo(): Promise<void> {
    // No-op marker - does nothing when undone
  }

  describe(): string {
    return '📌 Bookmark';
  }
}

/**
 * Singleton instance of BookmarkCommand.
 * Use this instance when marking return points in the ViewStack.
 *
 * @example
 * commitAndPushView(importView, { commands: [BOOKMARK] });
 */
export const BOOKMARK = new BookmarkCommand();
