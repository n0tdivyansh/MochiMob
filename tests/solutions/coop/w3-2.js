import { crossGap } from '../tether.js';

export default (n) => {
  const diver = n - 1;
  const anchor = n - 2;
  const front = Array.from({ length: n }, (_, k) => n - 1 - k);
  return [
    { do: 'walk', p: diver, to: 12.5 },
    { do: 'walk', p: anchor, to: 11.5 },
    { do: 'hold', p: diver, bits: 2, ticks: 25 },
    { do: 'until', label: 'key', test: (s) => s.key.holder === diver },
    { do: 'par', steps: Array.from({ length: n - 1 }, (_, k) => ({ do: 'walk', p: n - 2 - k, to: 6 - k * 1.2, tol: 40 })) },
    { do: 'until', label: 'diver out', test: (s) => s.blobs[diver].grounded && s.blobs[diver].y + 48 <= 640.5 },
    ...crossGap(front, 14, 16),
    ...crossGap(front, 26, 29),
    { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
  ];
};
