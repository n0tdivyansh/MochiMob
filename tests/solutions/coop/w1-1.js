// Front blob is the base under the shelf; the next one climbs on it and jumps up.
// Blobs are solid, so blobs further ahead always get targets further right.
export default (n) => {
  const base = n - 1;
  const top = n - 2;
  const cross = (p, to) => [
    { do: 'walk', p, to: 11, hop: true },
    { do: 'walkJump', p, to, at: 12.4 },
  ];
  const others = [];
  for (let p = n - 3; p >= 0; p--) others.push(...cross(p, 21 + p));
  return [
    ...cross(base, 20),
    ...cross(top, 18),
    { do: 'walkJump', p: top, to: 20, at: 19 },
    { do: 'jump', p: top },
    { do: 'until', test: (s) => s.key.holder === top },
    { do: 'walk', p: base, to: 34 },
    ...others,
    { do: 'walk', p: top, to: 30 },
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  ];
};
