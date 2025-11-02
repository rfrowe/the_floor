/**
 * Generic BroadcastChannel utility for cross-window/tab synchronization
 * Provides a reusable pattern for syncing data across browser contexts
 */

export interface BroadcastSyncOptions<T> {
  channelName: string;
  onMessage: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Creates a BroadcastChannel for cross-window sync
 * Returns send function and cleanup function
 */
export function createBroadcastSync<T>(options: BroadcastSyncOptions<T>): {
  send: (data: T) => void;
  cleanup: () => void;
  isSupported: boolean;
} {
  const { channelName, onMessage, onError } = options;
  let channel: BroadcastChannel | null = null;
  let isSupported = false;

  try {
    channel = new BroadcastChannel(channelName);
    isSupported = true;

    channel.onmessage = (event: MessageEvent<T>) => {
      try {
        onMessage(event.data);
      } catch (error) {
        onError?.(error as Error);
        console.error(`[BroadcastSync:${channelName}] Error in message handler:`, error);
      }
    };

    channel.onmessageerror = (error: MessageEvent) => {
      const err = new Error('BroadcastChannel message error');
      onError?.(err);
      console.error(`[BroadcastSync:${channelName}] Message error:`, error);
    };
  } catch (error) {
    console.warn(`[BroadcastSync:${channelName}] Not supported:`, error);
    isSupported = false;
  }

  const send = (data: T) => {
    if (!channel) {
      console.warn(`[BroadcastSync:${channelName}] Cannot send - channel not initialized`);
      return;
    }

    try {
      channel.postMessage(data);
    } catch (error) {
      onError?.(error as Error);
      console.error(`[BroadcastSync:${channelName}] Failed to send:`, error);
    }
  };

  const cleanup = () => {
    if (channel) {
      channel.close();
      channel = null;
    }
  };

  return { send, cleanup, isSupported };
}
