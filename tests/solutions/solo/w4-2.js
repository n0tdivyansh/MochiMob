export default () => [
  { do: 'swap', to: 1 },
  { do: 'follow', on: true },
  { do: 'walk', p: 1, to: 14, tol: 6 },
  { do: 'until', label: 'latched', test: (s) => s.plates[0].latched },
  { do: 'walk', p: 1, to: 23 },
  { do: 'until', label: 'key', test: (s) => s.key.holder === 1 },
  { do: 'enter', p: 1 },
  { do: 'follow', on: false },
  { do: 'enter', p: 0 },
];
