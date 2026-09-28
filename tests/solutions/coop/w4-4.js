import { climbTower } from '../tower.js';

export default (n) => [
  ...climbTower((p, s) => s),
  { do: 'until', label: 'key', test: (s) => s.key.holder >= 0 },
  { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
];
