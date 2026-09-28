import { liftReady, liftTop, powered } from '../summit.js';

export default (n) => {
  const sq = n - 1;
  const bouncer = n - 2;
  const spots = [26, 25, 24, 25];
  return [
    { do: 'walk', p: sq, to: 9 },
    { do: 'squish', p: sq, on: true },
    { do: 'walk', p: bouncer, to: 7 },
    { do: 'walkJump', p: bouncer, to: 9, at: 8 },
    { do: 'until', label: 'key', test: (s) => s.key.holder === bouncer },
    { do: 'walk', p: bouncer, to: 12 },
    { do: 'squish', p: sq, on: false },
    { do: 'walk', p: 1, to: 16.5, hop: true, tol: 6 },
    powered,
    { do: 'walkJump', p: 1, to: 20, at: 17.3, tol: 20 },
    {
      do: 'dyn',
      label: 'board lift',
      make: (s) => {
        const order = s.blobs.slice().sort((a, b) => b.x - a.x).map((b) => b.i);
        return [
          { do: 'par', steps: order.map((p, k) => ({ do: 'walk', p, to: 22.5 - k * 1.1, hop: true, tol: 20 })) },
          liftReady,
          { do: 'par', steps: order.map((p, k) => ({ do: 'walk', p, to: spots[k], tol: 5, hop: k === 3 })) },
        ];
      },
    },
    liftTop,
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  ];
};
