import w11 from './w1-1.js';
import w12 from './w1-2.js';
import w13 from './w1-3.js';
import w14 from './w1-4.js';
import w15 from './w1-5.js';
import w21 from './w2-1.js';
import w22 from './w2-2.js';
import w23 from './w2-3.js';
import w24 from './w2-4.js';
import w25 from './w2-5.js';
import w31 from './w3-1.js';
import w32 from './w3-2.js';
import w33 from './w3-3.js';

export const WORLDS = [
  { id: 1, name: 'Puddle Meadow', theme: 'meadow' },
  { id: 2, name: 'Tinker Works', theme: 'works' },
  { id: 3, name: 'Tangle Woods', theme: 'woods' },
  { id: 4, name: 'Prism Peaks', theme: 'peaks' },
];

export const LEVELS = [w11, w12, w13, w14, w15, w21, w22, w23, w24, w25, w31, w32, w33];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) ?? null;
}

export function nextLevelId(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
}
