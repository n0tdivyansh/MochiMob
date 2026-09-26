import { atStart, atEnd } from '../boughs.js';
import { finish } from '../tether.js';

export default () => [
  { do: 'swap', to: 1 },
  { do: 'walk', p: 1, to: 10.5, tol: 20 },
  { do: 'follow', on: true },
  atStart(0),
  { do: 'walk', p: 1, to: 14, tol: 5 },
  { do: 'until', label: 'both aboard A', test: (s) => s.blobs.every((b) => b.support && b.support.kind === 'lift') },
  { do: 'follow', on: false },
  atEnd(0),
  { do: 'walkJump', p: 1, to: 25, at: 21.6, tol: 6 },
  { do: 'swap', to: 0 },
  { do: 'walkJump', p: 0, to: 23.8, at: 21.6, tol: 6 },
  atStart(1),
  finish(2, 38, { solo: true }),
];
