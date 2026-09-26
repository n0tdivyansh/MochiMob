// p0 holds plate A; everyone else goes through; p1 holds plate B while p0 follows.
export default (n) => {
  const gateOpen = { do: 'until', label: 'shutter open', test: (s) => s.gates[0].open >= 1 };
  const steps = [];
  for (let p = n - 1; p >= 1; p--) steps.push({ do: 'walk', p, to: 16 + p });
  steps.push({ do: 'walk', p: 0, to: 16 }, gateOpen);
  for (let p = n - 1; p >= 2; p--) steps.push({ do: 'walk', p, to: 25 + p, hop: true });
  steps.push({ do: 'walk', p: 1, to: 24 }, { do: 'walk', p: 0, to: 30.5, hop: true });
  steps.push({ do: 'jump', p: 0 }, { do: 'until', label: 'key', test: (s) => s.key.holder === 0 });
  steps.push({ do: 'walk', p: 0, to: 35, hop: true });
  steps.push({ do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) });
  return steps;
};
