/**
 * Centralized logging utility for The Floor
 * Provides consistent formatting with timestamps, context, and log levels
 */

type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

interface LogOptions {
  data?: unknown;
  color?: string;
}

const LOG_COLORS = {
  debug: '#888888',
  info: '#3b82f6',
  success: '#10b981',
  warn: '#f59e0b',
  error: '#ef4444',
} as const;

const LOG_ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  success: '✅',
  warn: '⚠️',
  error: '❌',
} as const;

/**
 * Format timestamp as HH:MM:SS.mmm
 */
function formatTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Create a logger for a specific context/component
 */
export function createLogger(context: string) {
  const log = (level: LogLevel, message: string, options?: LogOptions) => {
    const timestamp = formatTime();
    const icon = LOG_ICONS[level];
    const color = options?.color ?? LOG_COLORS[level];

    const prefix = `[${timestamp}] [${context}]`;

    // Use console styling for browsers
    if (level === 'error') {
      console.error(`%c${icon} ${prefix} ${message}`, `color: ${color}; font-weight: bold`);
      if (options?.data) console.error(options.data);
    } else if (level === 'warn') {
      console.warn(`%c${icon} ${prefix} ${message}`, `color: ${color}; font-weight: bold`);
      if (options?.data) console.warn(options.data);
    } else {
      console.log(`%c${icon} ${prefix} ${message}`, `color: ${color}`);
      if (options?.data) console.log(options.data);
    }
  };

  return {
    debug: (message: string, data?: unknown) => {
      log('debug', message, { data });
    },
    info: (message: string, data?: unknown) => {
      log('info', message, { data });
    },
    success: (message: string, data?: unknown) => {
      log('success', message, { data });
    },
    warn: (message: string, data?: unknown) => {
      log('warn', message, { data });
    },
    error: (message: string, data?: unknown) => {
      log('error', message, { data });
    },

    // Special formatters for common operations
    dbAdd: (entity: string, id: string) => {
      log('success', `Added ${entity}: ${id}`, { color: '#10b981' });
    },
    dbUpdate: (entity: string, id: string) => {
      log('info', `Updated ${entity}: ${id}`, { color: '#3b82f6' });
    },
    dbDelete: (entity: string, id: string) => {
      log('warn', `Deleted ${entity}: ${id}`, { color: '#f59e0b' });
    },
    dbClear: (entity: string) => {
      log('warn', `Cleared all ${entity}`, { color: '#f59e0b' });
    },

    asyncStart: (operation: string) => {
      log('info', `⏳ Starting: ${operation}`, { color: '#6366f1' });
    },
    asyncComplete: (operation: string, duration?: number) => {
      log('success', `⏱️ Completed: ${operation}${duration ? ` (${String(duration)}ms)` : ''}`, {
        color: '#10b981',
      });
    },
    asyncError: (operation: string, error: unknown) => {
      log('error', `Failed: ${operation}`, { data: error });
    },
  };
}

/**
 * Global logger for general app-level messages
 */
export const logger = createLogger('App');

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
  indexedDB: createLogger('IndexedDB'),
  viewStack: createLogger('ViewStack'),
  commands: createLogger('Commands'),
  broadcast: createLogger('Broadcast'),
  storage: createLogger('Storage'),
};
