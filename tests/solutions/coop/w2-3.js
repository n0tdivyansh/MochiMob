export default (n) => {
  const base = n - 1;
  const top = n - 2;
  const steps = [
    { do: 'walk', p: base, to: 9 },
    { do: 'walk', p: top, to: 7 },
    { do: 'walkJump', p: top, to: 9, at: 8 },
    { do: 'jump', p: top },
    { do: 'until', label: 'key', test: (s) => s.key.holder === top },
    { do: 'walk', p: top, to: 24 },
    { do: 'walk', p: base, to: 23 },
  ];
  if (n >= 3) steps.push({ do: 'walk', p: n - 3, to: 22 });
  if (n >= 4) steps.push({ do: 'walk', p: n - 4, to: 22, hop: true });
  steps.push(
    { do: 'until', label: 'lift at top', test: (s) => s.lifts[0].t >= 1 },
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  );
  return steps;
};
