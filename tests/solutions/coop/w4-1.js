const BOOTH = [8.5, 14.5, 20.5, 26.5];

export default (n) => {
  const steps = [];
  for (let p = n - 1; p >= 0; p--) steps.push({ do: 'walk', p, to: BOOTH[p], tol: 6 });
  steps.push(
    { do: 'until', label: 'key', test: (s) => s.key.holder === 0 },
    { do: 'until', label: 'shutter open', test: (s) => s.gates[0].open >= 1 },
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  );
  return steps;
};
