// Axis-aligned rectangle helpers. Rects are {x, y, w, h} with x/y top-left.

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Rects share an edge (within eps) and overlap along the other axis.
export function touching(a, b, eps = 0.5) {
  const xOverlap = a.x < b.x + b.w && a.x + a.w > b.x;
  const yOverlap = a.y < b.y + b.h && a.y + a.h > b.y;
  const hTouch = yOverlap && (Math.abs(a.x + a.w - b.x) <= eps || Math.abs(b.x + b.w - a.x) <= eps);
  const vTouch = xOverlap && (Math.abs(a.y + a.h - b.y) <= eps || Math.abs(b.y + b.h - a.y) <= eps);
  return hTouch || vTouch;
}

export function hOverlapLen(a, b) {
  return Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
}

export function vOverlapLen(a, b) {
  return Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
}
