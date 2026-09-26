export default (n) => {
  const squisher = n - 1;
  const bouncer = n - 2;
  const cross = (p, to) => [
    { do: 'walk', p, to: 21, hop: true },
    { do: 'walkJump', p, to, at: 23.4, hop: true },
  ];
  const others = [];
  for (let p = n - 3; p >= 0; p--) others.push(...cross(p, 33 - (n - 3 - p)));
  return [
    { do: 'walk', p: squisher, to: 17 },
    { do: 'squish', p: squisher, on: true },
    { do: 'walk', p: bouncer, to: 15 },
    { do: 'walkJump', p: bouncer, to: 17, at: 16 },
    { do: 'until', test: (s) => s.key.holder === bouncer },
    { do: 'walk', p: bouncer, to: 20 },
    { do: 'squish', p: squisher, on: false },
    ...cross(bouncer, 36),
    ...cross(squisher, 34),
    ...others,
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  ];
};
