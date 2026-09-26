import { relayGate, finale, GATES } from '../relay.js';

const mv = (p, step) => ({ do: 'seq', steps: [{ do: 'swap', to: p }, step] });

export default () => [
  ...GATES.map((g) => relayGate(mv, g)),
  finale(mv, 2),
  {
    do: 'dyn',
    make: (s) => {
      const first = s.key.holder;
      const other = 1 - first;
      return [{ do: 'swap', to: first }, { do: 'enter', p: first }, { do: 'enter', p: other }];
    },
  },
];
