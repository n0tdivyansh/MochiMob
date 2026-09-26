import w11 from './w1-1.js';

export const WORLDS = [
  { id: 1, name: 'Puddle Meadow', theme: 'meadow' },
  { id: 2, name: 'Tinker Works', theme: 'works' },
  { id: 3, name: 'Tangle Woods', theme: 'woods' },
  { id: 4, name: 'Prism Peaks', theme: 'peaks' },
];

export const LEVELS = [w11];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) ?? null;
}

export function nextLevelId(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
}
