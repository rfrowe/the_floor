/**
 * Utility functions for assigning colors to contestants in the grid view
 * Uses BroadcastChannel for cross-window sync
 */

import { createBroadcastSync } from './broadcastSync';

const COLOR_CHANNEL_NAME = 'the_floor_color_assignments';

// Highly distinct colors with maximum contrast - carefully selected to be visually different
const DISTINCT_COLORS = [
  '#FF0000', // 1. Pure red
  '#00FF00', // 2. Pure green
  '#0000FF', // 3. Pure blue
  '#FFFF00', // 4. Pure yellow
  '#FF00FF', // 5. Pure magenta
  '#00FFFF', // 6. Pure cyan
  '#FF8800', // 7. Orange
  '#8800FF', // 8. Purple
  '#00DD00', // 9. Green (darker than lime)
  '#FF0066', // 10. Hot pink
  '#66FF00', // 11. Lime green
  '#0088FF', // 12. Sky blue
  '#FF4400', // 13. Red-orange
  '#AAFF00', // 14. Yellow-green
  '#0044FF', // 15. Royal blue
  '#FF0044', // 16. Crimson
  '#00FF66', // 17. Spring green
  '#6600FF', // 18. Indigo
  '#FFAA00', // 19. Gold
  '#CC00FF', // 20. Violet
  '#00FFAA', // 21. Turquoise
  '#FF6600', // 22. Bright orange
  '#00AAFF', // 23. Light blue
  '#FF00AA', // 24. Pink-magenta
  '#AAFF66', // 25. Pale lime
  '#FF66AA', // 26. Light pink
  '#66AAFF', // 27. Periwinkle
  '#FFAA66', // 28. Peach
  '#AA66FF', // 29. Light purple
  '#66FFAA', // 30. Mint
];

const COLOR_STORAGE_KEY = 'the_floor_color_assignments';

/**
 * Load color assignments from localStorage
 */
function loadColorAssignments(): Map<string, string> {
  try {
    const stored = localStorage.getItem(COLOR_STORAGE_KEY);
    if (stored) {
      const obj = JSON.parse(stored) as Record<string, string>;
      return new Map(Object.entries(obj));
    }
  } catch (error) {
    console.warn('Failed to load color assignments:', error);
  }
  return new Map();
}

/**
 * Save color assignments to localStorage
 */
function saveColorAssignments(assignments: Map<string, string>): void {
  try {
    const obj = Object.fromEntries(assignments);
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.warn('Failed to save color assignments:', error);
  }
}

// Global mapping of contestant IDs to assigned colors (loaded from localStorage)
let colorAssignments = loadColorAssignments();

// BroadcastChannel for syncing color assignments across windows
const colorBroadcast = createBroadcastSync<Record<string, string>>({
  channelName: COLOR_CHANNEL_NAME,
  onMessage: (data) => {
    // Reload color assignments from the broadcast
    colorAssignments = new Map(Object.entries(data));
  },
});

/**
 * Generates a random distinct color not in the predefined list
 */
function generateRandomColor(): string {
  // Generate random RGB values with high saturation
  const hue = Math.random() * 360;
  const saturation = 80 + Math.random() * 20; // 80-100%
  const lightness = 50 + Math.random() * 20; // 50-70%

  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * (lightness / 100) - 1)) * (saturation / 100);
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness / 100 - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Gets a consistent, unique color for a contestant based on their ID
 * Ensures no two contestants have the same color across all windows/tabs
 * @param contestantId - The contestant's unique ID (undefined for empty squares)
 * @returns Hex color string
 */
export function getContestantColor(contestantId?: string): string {
  if (!contestantId) {
    return '#2a2a2a'; // Dark gray for empty squares
  }

  // Return existing assignment if contestant already has a color
  const existingColor = colorAssignments.get(contestantId);
  if (existingColor) {
    return existingColor;
  }

  // Find which colors are already used
  const usedColors = new Set(colorAssignments.values());

  // Find first unused color from predefined list
  let color = DISTINCT_COLORS.find((c) => !usedColors.has(c));

  // If all predefined colors used, generate random color
  color ??= generateRandomColor();

  // Store assignment in memory and localStorage
  colorAssignments.set(contestantId, color);
  saveColorAssignments(colorAssignments);

  // Broadcast to other windows
  colorBroadcast.send(Object.fromEntries(colorAssignments));

  return color;
}

/**
 * Resets all color assignments (useful for testing or app reset)
 */
export function resetColorAssignments(): void {
  colorAssignments.clear();
  try {
    localStorage.removeItem(COLOR_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear color assignments:', error);
  }

  // Broadcast reset to other windows
  colorBroadcast.send({});
}
