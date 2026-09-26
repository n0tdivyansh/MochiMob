import { relayGate, finale, GATES } from '../relay.js';

const mv = (p, step) => step;

export default (n) => [
  ...GATES.map((g) => relayGate(mv, g)),
  finale(mv, n),
  { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
];
