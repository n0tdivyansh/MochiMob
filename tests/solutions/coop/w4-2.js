export default (n) => [
  { do: 'par', steps: Array.from({ length: n }, (_, k) => ({ do: 'walk', p: n - 1 - k, to: 15 - k, tol: 6 })) },
  { do: 'until', label: 'latched', test: (s) => s.plates[0].latched },
  { do: 'walk', p: n - 1, to: 23 },
  { do: 'until', label: 'key', test: (s) => s.key.holder === n - 1 },
  { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
];
