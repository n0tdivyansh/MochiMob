const cross = (p, to) => [
  { do: 'walk', p, to: 21, hop: true },
  { do: 'walkJump', p, to, at: 23.4, hop: true },
];
export default () => [
  { do: 'swap', to: 1 },
  { do: 'walk', p: 1, to: 17 },
  { do: 'squish', p: 1, on: true },
  { do: 'swap', to: 0 },
  { do: 'walk', p: 0, to: 15 },
  { do: 'walkJump', p: 0, to: 17, at: 16 },
  { do: 'until', test: (s) => s.key.holder === 0 },
  { do: 'walk', p: 0, to: 20 },
  ...cross(0, 36),
  { do: 'enter', p: 0 },
  { do: 'squish', p: 1, on: false },
  ...cross(1, 36),
  { do: 'enter', p: 1 },
];
