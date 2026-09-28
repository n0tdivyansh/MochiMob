const open = { do: 'until', label: 'shutter open', test: (s) => s.gates[0].open >= 1 };

export default (n) => {
  const steps = [];
  for (let p = n - 1; p >= 2; p--) steps.push({ do: 'walk', p, to: 9 + p });
  steps.push({ do: 'walk', p: 1, to: 10 }, { do: 'walk', p: 0, to: 9 }, open);
  for (let p = n - 1; p >= 2; p--) steps.push({ do: 'walk', p, to: 27 + p, hop: true });
  steps.push(
    { do: 'walk', p: 0, to: 16, hop: true },
    { do: 'walk', p: 1, to: 18, hop: true },
    { do: 'walk', p: 1, to: 24.5, tol: 6 },
    { do: 'until', label: 'key', test: (s) => s.key.holder === 1 },
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  );
  return steps;
};
