/**
 * Generic BroadcastChannel utility for cross-window/tab synchronization
 * Provides a reusable pattern for syncing data across browser contexts
 *
 * Uses singleton pattern to ensure one channel instance per channel name,
 * preventing channel closure issues when components unmount.
 */

export interface BroadcastSyncOptions<T> {
  channelName: string;
  onMessage: (data: T) => void;
  onError?: (error: Error) => void;
}

// Singleton storage for BroadcastChannels
const channelRegistry = new Map<
  string,
  {
    channel: BroadcastChannel | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners: Set<(data: any) => void>;
    refCount: number;
  }
>();

/**
 * Creates a BroadcastChannel for cross-window sync using singleton pattern
 * Returns send function and cleanup function
 */
export function createBroadcastSync<T>(options: BroadcastSyncOptions<T>): {
  send: (data: T) => void;
  cleanup: () => void;
  isSupported: boolean;
} {
  const { channelName, onMessage, onError } = options;

  // Get or create singleton entry
  let entry = channelRegistry.get(channelName);

  if (!entry) {
    try {
      const channel = new BroadcastChannel(channelName);

      entry = {
        channel,
        listeners: new Set(),
        refCount: 0,
      };

      // Set up message handler to dispatch to all listeners (from other tabs)
      channel.onmessage = (event: MessageEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        entry!.listeners.forEach((listener) => {
          try {
            listener(event.data);
          } catch (error) {
            console.error(`[BroadcastSync:${channelName}] Error in listener:`, error);
          }
        });
      };

      channel.onmessageerror = (error: MessageEvent) => {
        console.error(`[BroadcastSync:${channelName}] Message error:`, error);
      };

      channelRegistry.set(channelName, entry);
    } catch (error) {
      console.warn(`[BroadcastSync:${channelName}] Not supported:`, error);
      entry = {
        channel: null,
        listeners: new Set(),
        refCount: 0,
      };
      channelRegistry.set(channelName, entry);
    }
  }

  // Add this listener
  entry.listeners.add(onMessage);
  entry.refCount++;

  const isSupported = entry.channel !== null;
  const currentEntry = entry;

  const send = (data: T) => {
    // Immediately dispatch to all listeners in the current window/tab
    currentEntry.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`[BroadcastSync:${channelName}] Error in local listener:`, error);
      }
    });

    // Also send via BroadcastChannel for cross-window sync
    if (currentEntry.channel) {
      try {
        currentEntry.channel.postMessage(data);
      } catch (error) {
        if (error instanceof Error && !error.message.includes('closed')) {
          onError?.(error);
          console.error(`[BroadcastSync:${channelName}] Failed to send:`, error);
        }
      }
    }
  };

  const cleanup = () => {
    // Remove this listener
    currentEntry.listeners.delete(onMessage);
    currentEntry.refCount--;

    // Only close channel when all references are gone
    if (currentEntry.refCount === 0 && currentEntry.channel) {
      currentEntry.channel.close();
      channelRegistry.delete(channelName);
    }
  };

  return { send, cleanup, isSupported };
}
