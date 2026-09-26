export default (n) => {
  const pushAll = { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'hold', p, bits: 2, ticks: 560 })) };
  const climb = (p, to) => [
    { do: 'walkJump', p, to: 30, at: 29 },
    { do: 'jump', p, dir: 1 },
    { do: 'walk', p, to },
  ];
  const steps = [pushAll, { do: 'until', test: (s) => s.crates[0].x >= 30 * 64 - 1 }];
  for (let p = n - 1; p >= 0; p--) steps.push(...climb(p, 39 - (n - 1 - p)));
  steps.push({ do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) });
  return steps;
};
