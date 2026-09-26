import { finish } from '../tether.js';
import { bounceOver } from '../bounce.js';

const across = (s, p) => s.blobs[p].grounded && s.blobs[p].x + 26 > 21 * 64 + 8 && s.blobs[p].y < 640;

export default () => [
  { do: 'swap', to: 1 },
  { do: 'walk', p: 1, to: 15 },
  { do: 'squish', p: 1, on: true },
  { do: 'swap', to: 0 },
  ...bounceOver(0, 15),
  { do: 'until', label: 'p0 across', test: (s) => across(s, 0) },
  { do: 'walk', p: 0, to: 25, tol: 30 },
  { do: 'swap', to: 1 },
  { do: 'squish', p: 1, on: false },
  { do: 'hold', p: 1, bits: 2, ticks: 20 },
  { do: 'swap', to: 0 },
  { do: 'walk', p: 0, to: 33, tol: 30 },
  { do: 'until', label: 'hauled', test: (s) => across(s, 1) },
  finish(2, 32, { solo: true }),
];
