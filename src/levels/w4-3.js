import { Grid } from './grid.js';

// Mixed Signals: the green plate holds the shutter for pink, the pink plate
// holds it for green. The key hides under green glass — and only pink may leave.
const g = new Grid(50, 16);
g.fill(0, 12, 49, 15, '#');
g.fill(24, 12, 25, 13, '.'); // key booth under green glass
g.set(24, 13, 'K');
g.spawns(1, 11);
g.set(45, 11, 'D');

export default {
  id: 'w4-3',
  world: 4,
  name: 'Mixed Signals',
  hint: 'Pink holds the door for green. Green holds it for pink.',
  par: 70,
  gold: 30,
  map: g.rows(),
  entities: [
    { type: 'plate', id: 'green', x: 10, y: 11, color: 1 },
    { type: 'gate', id: 'shutter', x: 13, y: 1, h: 11, link: ['green', 'pink'] },
    { type: 'plate', id: 'pink', x: 16, y: 11, color: 0 },
    { type: 'cgate', x: 24, y: 12, w: 2, h: 0.25, color: 1 },
    { type: 'paint', x: 30, y: 11, color: 0 },
    { type: 'cgate', x: 34, y: 1, h: 11, color: 0 },
  ],
};
