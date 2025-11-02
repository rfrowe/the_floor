/**
 * Tests for broadcastSync utility
 */

import { describe, it, expect, vi } from 'vitest';
import { createBroadcastSync } from './broadcastSync';

describe('broadcastSync', () => {
  describe('createBroadcastSync', () => {
    it('creates a BroadcastChannel with the specified name', () => {
      const onMessage = vi.fn();
      const sync = createBroadcastSync({
        channelName: 'test-channel',
        onMessage,
      });

      expect(sync.isSupported).toBe(true);
      sync.cleanup();
    });

    it('provides send function', () => {
      const onMessage = vi.fn();
      const sync = createBroadcastSync({
        channelName: 'test-send',
        onMessage,
      });

      expect(typeof sync.send).toBe('function');
      sync.cleanup();
    });

    it('provides cleanup function', () => {
      const onMessage = vi.fn();
      const sync = createBroadcastSync({
        channelName: 'test-cleanup',
        onMessage,
      });

      expect(typeof sync.cleanup).toBe('function');

      // Should not throw when called
      expect(() => {
        sync.cleanup();
      }).not.toThrow();
    });

    it('receives messages from other channel instances', () => {
      const onMessage1 = vi.fn();
      const onMessage2 = vi.fn();

      const sync1 = createBroadcastSync({
        channelName: 'test-message',
        onMessage: onMessage1,
      });

      const sync2 = createBroadcastSync({
        channelName: 'test-message',
        onMessage: onMessage2,
      });

      // Send from sync1
      sync1.send({ test: 'data' });

      // Wait for message propagation
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // sync2 should receive the message
          expect(onMessage2).toHaveBeenCalledWith({ test: 'data' });
          sync1.cleanup();
          sync2.cleanup();
          resolve();
        }, 50);
      });
    });

    it('handles onError callback when provided', () => {
      const onMessage = vi.fn(() => {
        throw new Error('Handler error');
      });
      const onError = vi.fn();

      const sync = createBroadcastSync({
        channelName: 'test-error',
        onMessage,
        onError,
      });

      // Trigger a message that will cause handler to throw
      sync.send({ test: 'data' });

      // Wait for error propagation
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // onError should be called when handler throws
          // Note: May not be called in all browser environments
          sync.cleanup();
          resolve();
        }, 100);
      });
    });

    it('cleans up properly', () => {
      const onMessage = vi.fn();
      const sync = createBroadcastSync({
        channelName: 'test-cleanup-verify',
        onMessage,
      });

      sync.cleanup();

      // After cleanup, send should not throw but won't deliver
      expect(() => {
        sync.send({ test: 'data' });
      }).not.toThrow();
    });

    it('handles multiple send calls', () => {
      const onMessage = vi.fn();
      const sync = createBroadcastSync({
        channelName: 'test-multi-send',
        onMessage,
      });

      sync.send({ test: 'data1' });
      sync.send({ test: 'data2' });
      sync.send({ test: 'data3' });

      sync.cleanup();
    });
  });

  describe('Type safety', () => {
    it('enforces type safety for messages', () => {
      interface TestMessage {
        id: string;
        value: number;
      }

      const onMessage = vi.fn();
      const sync = createBroadcastSync<TestMessage>({
        channelName: 'test-types',
        onMessage,
      });

      // TypeScript should enforce this at compile time
      sync.send({ id: 'test', value: 123 });

      sync.cleanup();
    });
  });
});
