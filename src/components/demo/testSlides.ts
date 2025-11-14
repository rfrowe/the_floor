/**
 * Shared test slides for SlideViewer and SlideList demos
 * Includes reference lines for censor box alignment validation
 */

import type { Slide } from '@types';

export const demoSlide: Slide = {
  imageUrl:
    'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%234a90a4"/%3E%3Ctext x="400" y="150" font-family="Arial" font-size="48" fill="white" text-anchor="middle"%3ESample Slide Image%3C/text%3E%3Ctext x="200" y="400" font-family="Arial" font-size="32" fill="%23ffd700"%3ECensored Content%3C/text%3E%3Ctext x="600" y="200" font-family="Arial" font-size="32" fill="%23ffd700"%3EHidden Text%3C/text%3E%3C/svg%3E',
  answer: 'Sample Answer',
  censorBoxes: [
    {
      x: 75.1,
      y: 29.0,
      width: 21.2,
      height: 4.7,
      color: '#000000',
    },
    {
      x: 24.7,
      y: 62.3,
      width: 33.2,
      height: 4.7,
      color: '#000000',
    },
  ],
};

// Test slides with reference lines for censor box alignment validation
// Lines extend 5% of image dimension past box corners for precise testing
export const quadrantTestSlides: Slide[] = [
  {
    // Box 1 (RED): 10-40%, 20-45% → lines extend ±5% of image: x:5-45, y:15-50
    // Box 2 (GREEN): 60-90%, 20-45% → lines extend ±5%: x:55-95, y:15-50
    // Box 3 (BLUE): 10-40%, 55-80% → lines extend ±5%: x:5-45, y:50-85
    // Box 4 (PURPLE): 60-90%, 55-80% → lines extend ±5%: x:55-95, y:50-85
    imageUrl:
      'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%23f8f9fa"/%3E%3Ctext x="400" y="35" font-family="Arial" font-size="24" font-weight="bold" fill="%23222" text-anchor="middle"%3EAlignment Test 1: Four Quadrants%3C/text%3E%3Ctext x="400" y="60" font-family="Arial" font-size="14" fill="%23666" text-anchor="middle"%3EBox edges align with lines (extended 5%25 of image size)%3C/text%3E%3C!-- Vertical lines for Box 1 (red) - x:10,40 extend to y:15-50 --%3E%3Cline x1="80" y1="90" x2="80" y2="300" stroke="%23ff0000" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="320" y1="90" x2="320" y2="300" stroke="%23ff0000" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Horizontal lines for Box 1 (red) - y:20,45 extend to x:5-45 --%3E%3Cline x1="40" y1="120" x2="360" y2="120" stroke="%23ff0000" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="40" y1="270" x2="360" y2="270" stroke="%23ff0000" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Vertical lines for Box 2 (green) - x:60,90 extend to y:15-50 --%3E%3Cline x1="480" y1="90" x2="480" y2="300" stroke="%2300aa00" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="720" y1="90" x2="720" y2="300" stroke="%2300aa00" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Horizontal lines for Box 2 (green) - y:20,45 extend to x:55-95 --%3E%3Cline x1="440" y1="120" x2="760" y2="120" stroke="%2300aa00" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="440" y1="270" x2="760" y2="270" stroke="%2300aa00" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Vertical lines for Box 3 (blue) - x:10,40 extend to y:50-85 --%3E%3Cline x1="80" y1="300" x2="80" y2="510" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="320" y1="300" x2="320" y2="510" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Horizontal lines for Box 3 (blue) - y:55,80 extend to x:5-45 --%3E%3Cline x1="40" y1="330" x2="360" y2="330" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="40" y1="480" x2="360" y2="480" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Vertical lines for Box 4 (purple) - x:60,90 extend to y:50-85 --%3E%3Cline x1="480" y1="300" x2="480" y2="510" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="720" y1="300" x2="720" y2="510" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Horizontal lines for Box 4 (purple) - y:55,80 extend to x:55-95 --%3E%3Cline x1="440" y1="330" x2="760" y2="330" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="440" y1="480" x2="760" y2="480" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3C/svg%3E',
    answer: 'Four Quadrants',
    censorBoxes: [
      // Red box: top-left quadrant
      { x: 10, y: 20, width: 30, height: 25, color: 'rgba(255, 0, 0, 0.6)' },
      // Green box: top-right quadrant
      { x: 60, y: 20, width: 30, height: 25, color: 'rgba(0, 170, 0, 0.6)' },
      // Blue box: bottom-left quadrant
      { x: 10, y: 55, width: 30, height: 25, color: 'rgba(0, 0, 221, 0.6)' },
      // Purple box: bottom-right quadrant
      { x: 60, y: 55, width: 30, height: 25, color: 'rgba(170, 0, 170, 0.6)' },
    ],
  },
  {
    // Box 1 (BLUE): 5-30%, 15-35% → lines extend 5% of img: x:0-35, y:10-40
    // Box 2 (ORANGE): 35-65%, 50-80% → extend 5%: x:30-70, y:45-85
    // Box 3 (PURPLE): 70-95%, 10-25% → extend 5%: x:65-100, y:5-30
    imageUrl:
      'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%23ffe8e8"/%3E%3Ctext x="400" y="35" font-family="Arial" font-size="24" font-weight="bold" fill="%23222" text-anchor="middle"%3EAlignment Test 2: Scattered Boxes%3C/text%3E%3Ctext x="400" y="60" font-family="Arial" font-size="14" fill="%23666" text-anchor="middle"%3EBox edges align with lines (extended 5%25 of image)%3C/text%3E%3C!-- Vertical lines for Box 1 (blue) - x:5,30 extend to y:10-40 --%3E%3Cline x1="40" y1="60" x2="40" y2="240" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="240" y1="60" x2="240" y2="240" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Horizontal lines for Box 1 (blue) - y:15,35 extend to x:0-35 --%3E%3Cline x1="0" y1="90" x2="280" y2="90" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="0" y1="210" x2="280" y2="210" stroke="%230000dd" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Vertical lines for Box 2 (orange) - x:35,65 extend to y:45-85 --%3E%3Cline x1="280" y1="270" x2="280" y2="510" stroke="%23ff8800" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="520" y1="270" x2="520" y2="510" stroke="%23ff8800" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Horizontal lines for Box 2 (orange) - y:50,80 extend to x:30-70 --%3E%3Cline x1="240" y1="300" x2="560" y2="300" stroke="%23ff8800" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="240" y1="480" x2="560" y2="480" stroke="%23ff8800" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Vertical lines for Box 3 (purple) - x:70,95 extend to y:5-30 --%3E%3Cline x1="560" y1="30" x2="560" y2="180" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="760" y1="30" x2="760" y2="180" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Horizontal lines for Box 3 (purple) - y:10,25 extend to x:65-100 --%3E%3Cline x1="520" y1="60" x2="800" y2="60" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="520" y1="150" x2="800" y2="150" stroke="%23aa00aa" stroke-width="2" stroke-dasharray="8,4"/%3E%3C/svg%3E',
    answer: 'Scattered Boxes',
    censorBoxes: [
      // Blue box: 5-30%, 15-35%
      { x: 5, y: 15, width: 25, height: 20, color: 'rgba(0, 0, 221, 0.6)' },
      // Orange box: 35-65%, 50-80%
      { x: 35, y: 50, width: 30, height: 30, color: 'rgba(255, 136, 0, 0.6)' },
      // Purple box: 70-95%, 10-25%
      { x: 70, y: 10, width: 25, height: 15, color: 'rgba(170, 0, 170, 0.6)' },
    ],
  },
  {
    // Box 1 (MAROON): 0-100%, 0-12% → bottom at y:12 (full width, top at border)
    // Box 2 (TEAL): 0-15%, 40-58% → right at x:15 extends y:35-63, top/bottom extend x:0-20
    // Box 3 (GOLD): 85-100%, 88-100% → left at x:85 extends y:83-100, top at y:88 extends x:80-100
    // Box 4 (NAVY): 40-60%, 35-65% → all internal, extend 5%: x:35-65, y:30-70
    imageUrl:
      'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%23e8ffe8"/%3E%3Ctext x="400" y="35" font-family="Arial" font-size="24" font-weight="bold" fill="%23222" text-anchor="middle"%3EAlignment Test 3: Edge Cases%3C/text%3E%3Ctext x="400" y="60" font-family="Arial" font-size="14" fill="%23666" text-anchor="middle"%3EBoxes at image edges (lines extended 5%25 of image)%3C/text%3E%3C!-- Box 1 (maroon) - bottom edge only (top at 0%25 border, full width so no vertical lines) --%3E%3Cline x1="0" y1="72" x2="800" y2="72" stroke="%23800000" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Box 2 (teal) - right, top, bottom (left at 0%25 border) --%3E%3Cline x1="120" y1="210" x2="120" y2="378" stroke="%23008080" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="0" y1="240" x2="160" y2="240" stroke="%23008080" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="0" y1="348" x2="160" y2="348" stroke="%23008080" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Box 3 (gold) - left, top only (right/bottom at 100%25 border) --%3E%3Cline x1="680" y1="498" x2="680" y2="600" stroke="%23b8860b" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="640" y1="528" x2="800" y2="528" stroke="%23b8860b" stroke-width="2" stroke-dasharray="8,4"/%3E%3C!-- Box 4 (navy) - all edges internal, extend 5%25: x:35-65, y:30-70 --%3E%3Cline x1="320" y1="180" x2="320" y2="420" stroke="%23000080" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="480" y1="180" x2="480" y2="420" stroke="%23000080" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="280" y1="210" x2="520" y2="210" stroke="%23000080" stroke-width="2" stroke-dasharray="8,4"/%3E%3Cline x1="280" y1="390" x2="520" y2="390" stroke="%23000080" stroke-width="2" stroke-dasharray="8,4"/%3E%3C/svg%3E',
    answer: 'Edge Cases',
    censorBoxes: [
      // Maroon box: 0-100%, 0-12% (top edge at border)
      { x: 0, y: 0, width: 100, height: 12, color: 'rgba(128, 0, 0, 0.5)' },
      // Teal box: 0-15%, 40-58% (left edge at border)
      { x: 0, y: 40, width: 15, height: 18, color: 'rgba(0, 128, 128, 0.5)' },
      // Gold box: 85-100%, 88-100% (bottom-right corner)
      { x: 85, y: 88, width: 15, height: 12, color: 'rgba(184, 134, 11, 0.5)' },
      // Navy box: 40-60%, 35-65% (center, all edges internal)
      { x: 40, y: 35, width: 20, height: 30, color: 'rgba(0, 0, 128, 0.5)' },
    ],
  },
];
