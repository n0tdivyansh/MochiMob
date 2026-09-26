import { crossGap, finish } from '../tether.js';

export default () => [
  ...crossGap([1, 0], 12, 15, { solo: true }),
  ...crossGap([1, 0], 30, 34, { solo: true }),
  finish(2, 40, { solo: true }),
];
