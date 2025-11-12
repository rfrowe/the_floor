/**
 * Command Pattern for ViewStack
 *
 * Each view can have a Command that executes when entered and undoes when left.
 * ViewStack automatically manages execute/undo based on navigation.
 */

export interface Command {
  /**
   * Execute the command (e.g., save to database)
   * Called when clicking "Import" or "Save"
   */
  execute(): Promise<void>;

  /**
   * Undo the command (e.g., delete from database)
   * Called when navigating back to a committed view
   */
  undo(): Promise<void>;

  /**
   * Optional: Get description for debugging
   */
  describe?(): string;
}

/**
 * No-op command for views that don't need execute/undo
 */
export class NoOpCommand implements Command {
  async execute(): Promise<void> {
    // No-op
  }

  async undo(): Promise<void> {
    // No-op
  }
}
