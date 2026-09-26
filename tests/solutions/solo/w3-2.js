import { crossGap } from '../tether.js';

export default () => [
  { do: 'swap', to: 1 },
  { do: 'walk', p: 1, to: 12.5 },
  { do: 'swap', to: 0 },
  { do: 'walk', p: 0, to: 11.5 },
  { do: 'swap', to: 1 },
  { do: 'hold', p: 1, bits: 2, ticks: 25 },
  { do: 'until', label: 'key', test: (s) => s.key.holder === 1 },
  { do: 'swap', to: 0 },
  { do: 'walk', p: 0, to: 6, tol: 40 },
  { do: 'until', label: 'diver out', test: (s) => s.blobs[1].grounded && s.blobs[1].y + 48 <= 640.5 },
  ...crossGap([1, 0], 14, 16, { solo: true, haul: 6 }),
  ...crossGap([1, 0], 26, 29, { solo: true, haul: 6 }),
  { do: 'swap', to: 1 },
  { do: 'enter', p: 1 },
  { do: 'swap', to: 0 },
  { do: 'enter', p: 0 },
];
