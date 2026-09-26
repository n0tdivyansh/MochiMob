import { PUSH_X, powered, liftReady, liftTop } from '../factory.js';

export default (n) => {
  const base = n - 1;
  const top = n - 2;
  const rest = [];
  for (let p = n - 3; p >= 0; p--) rest.push(p);
  const spots = [25, 24, 23, 24];
  const boarders = [top, base, ...rest];
  return [
    { do: 'walk', p: base, to: 9 },
    { do: 'walk', p: top, to: 7 },
    { do: 'walkJump', p: top, to: 9, at: 8 },
    { do: 'jump', p: top },
    { do: 'walk', p: top, px: PUSH_X },
    powered,
    { do: 'walk', p: base, to: 20, hop: true },
    { do: 'squish', p: base, on: true },
    { do: 'walk', p: top, to: 18, hop: true },
    { do: 'walkJump', p: top, to: 20, at: 19 },
    { do: 'until', label: 'key', test: (s) => s.key.holder === top },
    { do: 'walk', p: top, to: 22 },
    { do: 'squish', p: base, on: false },
    ...rest.map((p, k) => ({ do: 'walk', p, to: 19 - k, hop: true })),
    liftReady,
    { do: 'par', steps: boarders.map((p, k) => ({ do: 'walk', p, to: spots[k], tol: 5, hop: k === 3 })) },
    liftTop,
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  ];
};
