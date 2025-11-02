/**
 * Timer Synchronization Service
 *
 * Provides low-latency cross-window timer synchronization using BroadcastChannel API.
 * Implements the authoritative timer architecture where Audience View controls timing
 * and Master View sends commands.
 *
 * Based on Task 28.1 requirements.
 */

const TIMER_CHANNEL_NAME = 'the-floor:timer-sync';
const HEARTBEAT_INTERVAL = 1000; // 1 second
const CONNECTION_TIMEOUT = 3000; // 3 seconds

/**
 * Message types for timer synchronization protocol
 */
export type TimerMessage =
  // Commands from Master View
  | { type: 'TIMER_START'; player1Time: number; player2Time: number; activePlayer: 1 | 2 }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESUME'; activePlayer: 1 | 2 }
  | { type: 'TIMER_SWITCH'; activePlayer: 1 | 2 }
  | { type: 'SKIP_START'; answer: string; activePlayer: 1 | 2 }
  | { type: 'DUEL_END' }
  // Broadcasts from Audience View
  | {
      type: 'TIMER_UPDATE';
      time1: number;
      time2: number;
      activePlayer: 1 | 2;
      timestamp: number;
    }
  | { type: 'SKIP_END'; switchToPlayer: 1 | 2 }
  | { type: 'PLAYER_TIMEOUT'; loser: 1 | 2 }
  // Connection detection
  | { type: 'AUDIENCE_HEARTBEAT' }
  | { type: 'MASTER_PING' };

/**
 * Timer Synchronization Service
 * Singleton service for managing cross-window timer communication
 */
class TimerSyncService {
  private channel: BroadcastChannel | null = null;
  private messageHandlers = new Set<(message: TimerMessage) => void>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastAudienceHeartbeat = 0;
  private connectionCheckCallbacks = new Set<() => void>();

  /**
   * Initialize the BroadcastChannel
   * Safe to call multiple times (idempotent)
   */
  initialize(): void {
    if (this.channel) {
      return; // Already initialized
    }

    try {
      this.channel = new BroadcastChannel(TIMER_CHANNEL_NAME);

      this.channel.onmessage = (event: MessageEvent<TimerMessage>) => {
        const message = event.data;

        // Track audience heartbeats
        if (message.type === 'AUDIENCE_HEARTBEAT') {
          this.lastAudienceHeartbeat = Date.now();
          this.notifyConnectionChange();
        }

        // Forward message to all handlers
        this.messageHandlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error('[TimerSync] Error in message handler:', error);
          }
        });
      };

      this.channel.onmessageerror = (error: MessageEvent) => {
        console.error('[TimerSync] BroadcastChannel message error:', error);
      };
    } catch (error) {
      console.error('[TimerSync] Failed to initialize BroadcastChannel:', error);
    }
  }

  /**
   * Register a message handler
   * Returns cleanup function to remove the handler
   */
  onMessage(handler: (message: TimerMessage) => void): () => void {
    this.messageHandlers.add(handler);

    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Send a message through the channel
   */
  private send(message: TimerMessage): void {
    if (!this.channel) {
      console.warn('[TimerSync] Cannot send message - channel not initialized');
      return;
    }

    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.error('[TimerSync] Failed to send message:', error);
    }
  }

  // ============================================================================
  // Master View Commands
  // ============================================================================

  /**
   * Start the timer (Master → Audience)
   */
  sendStart(player1Time: number, player2Time: number, activePlayer: 1 | 2): void {
    this.send({ type: 'TIMER_START', player1Time, player2Time, activePlayer });
  }

  /**
   * Pause the timer (Master → Audience)
   */
  sendPause(): void {
    this.send({ type: 'TIMER_PAUSE' });
  }

  /**
   * Resume the timer (Master → Audience)
   */
  sendResume(activePlayer: 1 | 2): void {
    this.send({ type: 'TIMER_RESUME', activePlayer });
  }

  /**
   * Switch active player (Master → Audience)
   */
  sendSwitch(activePlayer: 1 | 2): void {
    this.send({ type: 'TIMER_SWITCH', activePlayer });
  }

  /**
   * Start skip animation (Master → Audience)
   */
  sendSkipStart(answer: string, activePlayer: 1 | 2): void {
    this.send({ type: 'SKIP_START', answer, activePlayer });
  }

  /**
   * End duel (Master → Audience)
   */
  sendDuelEnd(): void {
    this.send({ type: 'DUEL_END' });
  }

  /**
   * Send master ping to check for audience (Master → Audience)
   */
  sendMasterPing(): void {
    this.send({ type: 'MASTER_PING' });
  }

  // ============================================================================
  // Audience View Broadcasts
  // ============================================================================

  /**
   * Broadcast current timer state (Audience → Master)
   */
  broadcastTimerUpdate(time1: number, time2: number, activePlayer: 1 | 2): void {
    this.send({
      type: 'TIMER_UPDATE',
      time1,
      time2,
      activePlayer,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast skip end (Audience → Master)
   */
  broadcastSkipEnd(switchToPlayer: 1 | 2): void {
    this.send({ type: 'SKIP_END', switchToPlayer });
  }

  /**
   * Broadcast player timeout (Audience → Master)
   */
  broadcastPlayerTimeout(loser: 1 | 2): void {
    this.send({ type: 'PLAYER_TIMEOUT', loser });
  }

  /**
   * Send heartbeat to indicate audience is alive (Audience → Master)
   */
  sendAudienceHeartbeat(): void {
    this.send({ type: 'AUDIENCE_HEARTBEAT' });
  }

  // ============================================================================
  // Connection Detection
  // ============================================================================

  /**
   * Start sending heartbeats (for Audience View)
   */
  startAudienceHeartbeat(): void {
    if (this.heartbeatInterval) {
      return; // Already started
    }

    // Send immediately
    this.sendAudienceHeartbeat();

    // Then every interval
    this.heartbeatInterval = setInterval(() => {
      this.sendAudienceHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop sending heartbeats
   */
  stopAudienceHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if audience is connected (for Master View)
   * Returns true if a heartbeat was received recently
   */
  isAudienceConnected(): boolean {
    if (this.lastAudienceHeartbeat === 0) {
      return false;
    }

    const timeSinceLastHeartbeat = Date.now() - this.lastAudienceHeartbeat;
    return timeSinceLastHeartbeat < CONNECTION_TIMEOUT;
  }

  /**
   * Register a callback to be notified when connection status changes
   */
  onConnectionChange(callback: () => void): () => void {
    this.connectionCheckCallbacks.add(callback);

    return () => {
      this.connectionCheckCallbacks.delete(callback);
    };
  }

  /**
   * Notify all connection change callbacks
   */
  private notifyConnectionChange(): void {
    this.connectionCheckCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('[TimerSync] Error in connection change callback:', error);
      }
    });
  }

  /**
   * Wait for audience to connect (for Master View)
   * Pings audience and waits for heartbeat response
   *
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @returns Promise that resolves to true if audience connected, false if timeout
   */
  async waitForAudience(timeoutMs: number): Promise<boolean> {
    // Check if already connected
    if (this.isAudienceConnected()) {
      return true;
    }

    // Send ping to audience
    this.sendMasterPing();

    // Wait for heartbeat or timeout
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        if (this.isAudienceConnected()) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * Cleanup and close the channel
   */
  cleanup(): void {
    this.stopAudienceHeartbeat();

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.messageHandlers.clear();
    this.connectionCheckCallbacks.clear();
    this.lastAudienceHeartbeat = 0;
  }
}

// Singleton instance
const timerSyncService = new TimerSyncService();

// Initialize on module load
timerSyncService.initialize();

export default timerSyncService;
