export default () => [
  { do: 'swap', to: 1 },
  { do: 'walk', p: 1, to: 11, hop: true },
  { do: 'walkJump', p: 1, to: 20, at: 12.4 },
  { do: 'swap', to: 0 },
  { do: 'walk', p: 0, to: 11, hop: true },
  { do: 'walkJump', p: 0, to: 18, at: 12.4 },
  { do: 'walkJump', p: 0, to: 20, at: 19 },
  { do: 'jump', p: 0 },
  { do: 'until', test: (s) => s.key.holder === 0 },
  { do: 'walk', p: 0, to: 31 },
  { do: 'enter', p: 0 },
  { do: 'enter', p: 1 },
];
