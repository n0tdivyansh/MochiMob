import { crossGap, finish } from '../tether.js';

export default (n) => {
  const front = Array.from({ length: n }, (_, k) => n - 1 - k); // front-most first
  return [...crossGap(front, 12, 15), ...crossGap(front, 30, 34), finish(n, 40)];
};
