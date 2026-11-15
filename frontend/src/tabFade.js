// Soft fade at the edges of a scrolling tab strip, drawn with a CSS mask so it
// works on any background in light and dark mode. `left` / `right` say whether
// there are more tabs hidden beyond that edge.
export const FADE_WIDTH = '32px';

export function fadeMask({ left, right }) {
  if (left && right) {
    return `linear-gradient(to right, transparent, #000 ${FADE_WIDTH}, #000 calc(100% - ${FADE_WIDTH}), transparent)`;
  }
  if (left) return `linear-gradient(to right, transparent, #000 ${FADE_WIDTH})`;
  if (right) return `linear-gradient(to left, transparent, #000 ${FADE_WIDTH})`;
  return 'none';
}

// Which edges have tabs hidden beyond them, from the strip's scroll position.
// A 2px slack avoids a flicker from sub-pixel rounding.
export function hiddenEdges({ scrollLeft, clientWidth, scrollWidth }) {
  return {
    left: scrollLeft > 2,
    right: scrollWidth - clientWidth - scrollLeft > 2,
  };
}

// Scroll position that centres a tab in the strip (never below 0).
export function centerTabLeft({ tabLeft, tabWidth, clientWidth }) {
  return Math.max(0, tabLeft - (clientWidth - tabWidth) / 2);
}
