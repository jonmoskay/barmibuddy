// Tiny colour helpers for keeping team-coloured UI readable on a dark bg.

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// Standard relative luminance (0..1)
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  const norm = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * norm(r) + 0.7152 * norm(g) + 0.0722 * norm(b);
}

// Mix toward white by `amount` (0..1)
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

// Pick a readable accent colour for use as text or fills on a dark background.
// If primary is too dark → fall back to secondary (if it's bright enough),
// otherwise lighten the primary so it pops.
export function readableAccent(primary?: string, secondary?: string, fallback = '#A78BFA'): string {
  if (!primary) return fallback;
  const lp = luminance(primary);
  if (lp >= 0.18) return primary;
  if (secondary) {
    const ls = luminance(secondary);
    if (ls >= 0.35) return secondary;
  }
  return lighten(primary, 0.55);
}
