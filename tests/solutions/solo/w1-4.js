const ride = (p, to) => [
  { do: 'walk', p, to: 13, tol: 30 },
  { do: 'squish', p, on: true },
  { do: 'until', test: (s) => s.blobs[p].x > 21 * 64 },
  { do: 'squish', p, on: false },
  { do: 'walk', p, to },
];
const cross = (p, to) => [
  { do: 'walk', p, to: 32, hop: true },
  { do: 'walkJump', p, to, at: 34.4, hop: true },
];
export default () => [
  { do: 'swap', to: 1 },
  ...ride(1, 29),
  { do: 'squish', p: 1, on: true },
  { do: 'swap', to: 0 },
  ...ride(0, 27),
  { do: 'walkJump', p: 0, to: 29, at: 28 },
  { do: 'until', test: (s) => s.key.holder === 0 },
  { do: 'walk', p: 0, to: 32 },
  ...cross(0, 44),
  { do: 'enter', p: 0 },
  { do: 'squish', p: 1, on: false },
  ...cross(1, 44),
  { do: 'enter', p: 1 },
];
