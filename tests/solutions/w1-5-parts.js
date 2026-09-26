// Shared building blocks for the 1-5 scripts.
export const EDGE1 = 13 * 64; // pusher centre on the tier-1 edge: crate 1 is fully off
export const EDGE2 = 27 * 64; // pusher centre on the tier-2 edge

export const onCrate1 = (p, to) => [
  { do: 'walk', p, to: 10 },
  { do: 'walkJump', p, to: 12, at: 11 },
  { do: 'jump', p, dir: 1 },
  { do: 'walk', p, to, hop: true },
];

export const onStack = (p, to) => [
  { do: 'walk', p, to: 23 },
  { do: 'walkJump', p, to: 26, at: 24.5 },
  { do: 'jump', p, dir: 1 },
  { do: 'walk', p, to },
];

const onFloor = (p, row) => ({ do: 'until', label: `p${p} on row ${row}`, timeout: 90, test: (s) => s.blobs[p].grounded && Math.abs(s.blobs[p].y + s.blobs[p].h - row * 64) < 1 });

export const stairs = (p, to) => [
  { do: 'walk', p, to: 34.5 },
  { do: 'jump', p },
  onFloor(p, 19),
  { do: 'jump', p },
  onFloor(p, 17),
  { do: 'jump', p },
  onFloor(p, 15),
  { do: 'jump', p },
  onFloor(p, 13),
  { do: 'walk', p, to },
];

export const fell = (idx, y) => ({ do: 'until', label: `crate ${idx} fell`, test: (s) => s.crates[idx].y > y && s.crates[idx].grounded });
