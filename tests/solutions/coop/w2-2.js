// Fill the trough (col 13 then col 12, then heads), then leave in an order that never blocks.
const EXIT = { 2: [1, 0], 3: [2, 0, 1], 4: [0, 1, 3, 2] };

export default (n) => {
  const fill = [
    { do: 'walk', p: n - 1, to: 13 },
    { do: 'walk', p: n - 2, to: 12 },
  ];
  if (n >= 3) fill.push({ do: 'walk', p: n - 3, to: 12 });
  if (n >= 4) fill.push({ do: 'walk', p: n - 4, to: 13, hop: true });
  const [base, top, ...rest] = EXIT[n];
  const steps = [...fill, { do: 'until', label: 'latched', test: (s) => s.plates[0].latched }];
  steps.push({ do: 'walk', p: base, to: 27, hop: true });
  steps.push({ do: 'walk', p: top, to: 25, hop: true });
  rest.forEach((p, k) => steps.push({ do: 'walk', p, to: 23 - k, hop: true }));
  steps.push(
    { do: 'walkJump', p: top, to: 27, at: 26 },
    { do: 'jump', p: top },
    { do: 'until', label: 'key', test: (s) => s.key.holder === top },
    { do: 'walk', p: top, to: 39 },
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  );
  return steps;
};
