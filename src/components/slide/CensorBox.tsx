/**
 * CensorBox Component
 *
 * Renders a single censor box overlay on a slide image.
 * Always renders fully opaque regardless of color alpha channel.
 */

import type { CensorBox as CensorBoxType } from '@types';

interface CensorBoxProps {
  box: CensorBoxType;
  className?: string;
}

/**
 * Strip alpha channel from color to ensure censor box is always opaque.
 * Converts rgba(r, g, b, a) to rgb(r, g, b) and hex with alpha (#RRGGBBAA) to #RRGGBB.
 */
function ensureOpaqueColor(color: string): string {
  if (color.startsWith('rgba(')) {
    const match = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/.exec(color);
    if (match?.[1] && match[2] && match[3]) {
      return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
    }
  }

  if (color.startsWith('#') && (color.length === 9 || color.length === 5)) {
    return color.slice(0, color.length === 9 ? 7 : 4);
  }

  return color;
}

/**
 * A single censor box overlay positioned using percentage coordinates.
 * The box is always rendered fully opaque, even if the color has an alpha channel.
 */
export function CensorBox({ box, className = '' }: CensorBoxProps) {
  // Extract style values to satisfy TypeScript strict template literal requirements
  const leftValue = String(box.x);
  const topValue = String(box.y);
  const widthValue = String(box.width);
  const heightValue = String(box.height);

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: `${leftValue}%`,
        top: `${topValue}%`,
        width: `${widthValue}%`,
        height: `${heightValue}%`,
        backgroundColor: ensureOpaqueColor(box.color),
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
