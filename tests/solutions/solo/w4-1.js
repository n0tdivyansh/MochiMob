export default () => [
  { do: 'swap', to: 1 },
  { do: 'walk', p: 1, to: 14.5, tol: 6 },
  { do: 'until', label: 'shutter open', test: (s) => s.gates[0].open >= 1 },
  { do: 'swap', to: 0 },
  { do: 'walk', p: 0, to: 8.5, tol: 6 },
  { do: 'until', label: 'key', test: (s) => s.key.holder === 0 },
  { do: 'enter', p: 0 },
  { do: 'enter', p: 1 },
];
