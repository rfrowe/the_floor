/**
 * Time utility functions for formatting and calculations
 */

/**
 * Formats time in seconds to display format with one decimal place
 *
 * Examples:
 * - formatTime(28.5) => "28.5s"
 * - formatTime(125.3) => "2:05.3"
 * - formatTime(-10) => "0.0s" (negative values clamped to 0)
 * - formatTime(0) => "0.0s"
 *
 * @param seconds - Time in seconds (can be decimal)
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const clampedSeconds = Math.max(0, seconds);
  const wholeSeconds = Math.floor(clampedSeconds);
  const milliseconds = Math.floor((clampedSeconds - wholeSeconds) * 10); // Show 1 decimal place

  if (wholeSeconds < 60) {
    return `${wholeSeconds.toString()}.${milliseconds.toString()}s`;
  }

  const mins = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;
  return `${mins.toString()}:${secs.toString().padStart(2, '0')}.${milliseconds.toString()}`;
}
