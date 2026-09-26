const climb = (p, to) => [

  { do: 'walkJump', p, to: 30, at: 29 },
  { do: 'jump', p, dir: 1 },
  { do: 'walk', p, to },
];
export default () => [
  { do: 'swap', to: 1 },
  { do: 'follow', on: true },
  { do: 'hold', p: 1, bits: 2, ticks: 560 },
  { do: 'until', test: (s) => s.crates[0].x >= 30 * 64 - 1 },
  { do: 'follow', on: false },
  ...climb(1, 39),
  { do: 'swap', to: 0 },
  ...climb(0, 37),
  { do: 'swap', to: 1 },
  { do: 'enter', p: 1 },
  { do: 'enter', p: 0 },
];
