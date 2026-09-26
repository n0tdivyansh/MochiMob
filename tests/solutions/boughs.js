export const atStart = (i) => ({ do: 'until', label: `bough ${i} at start`, test: (s) => s.lifts[i].t === 0 && s.lifts[i].wait > 110 });
export const atEnd = (i) => ({ do: 'until', label: `bough ${i} at end`, test: (s) => s.lifts[i].t === 1 && s.lifts[i].wait > 110 });
// Tile columns (centres) on each bough when it is parked.
export const A_SPOTS = [14, 13, 12, 13];
export const B_SPOTS = [25, 24, 23, 24];
