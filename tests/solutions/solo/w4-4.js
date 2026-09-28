import { climbTower } from '../tower.js';

export default () => [
  ...climbTower((p, s) => ({ do: 'seq', steps: [{ do: 'swap', to: p }, s] })),
  {
    do: 'dyn',
    make: (s) => {
      const h = s.key.holder;
      return [h, 1 - h].flatMap((p) => [{ do: 'swap', to: p }, { do: 'enter', p }]);
    },
  },
];
