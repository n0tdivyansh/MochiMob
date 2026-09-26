const ride = (p, to) => [
  { do: 'walk', p, to: 13, tol: 30 },
  { do: 'squish', p, on: true },
  { do: 'until', test: (s) => s.blobs[p].x > 21 * 64 },
  { do: 'squish', p, on: false },
  { do: 'walk', p, to },
];
const cross = (p, to) => [
  { do: 'walk', p, to: 32, hop: true },
  { do: 'walkJump', p, to, at: 34.4, hop: true },
];

export default (n) => {
  const squisher = n - 1;
  const bouncer = n - 2;
  const steps = [...ride(squisher, 29), ...ride(bouncer, 27)];
  for (let p = n - 3; p >= 0; p--) steps.push(...ride(p, 25 - (n - 3 - p)));
  steps.push(
    { do: 'squish', p: squisher, on: true },
    { do: 'walkJump', p: bouncer, to: 29, at: 28 },
    { do: 'until', test: (s) => s.key.holder === bouncer },
    { do: 'walk', p: bouncer, to: 32 },
    { do: 'squish', p: squisher, on: false },
    ...cross(bouncer, 44),
    ...cross(squisher, 42),
  );
  for (let p = n - 3; p >= 0; p--) steps.push(...cross(p, 41 - (n - 3 - p)));
  steps.push({ do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) });
  return steps;
};
