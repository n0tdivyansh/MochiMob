import { Grid } from './grid.js';

// Relay: three shutters in a row. Hold the plate, pass the baton, repeat —
// and the last shutter only opens when the whole team piles on its plate.
const g = new Grid(57, 12);
g.fill(0, 10, 56, 11, '#');
g.fill(23, 8, 25, 9, '#'); // step holding plate L2
g.set(51, 9, 'K');
g.spawns(1, 9);
g.set(54, 9, 'D');

export default {
  id: 'w2-4',
  world: 2,
  name: 'Relay',
  hint: 'Take turns holding the doors for each other.',
  par: 90,
  gold: 40,
  map: g.rows(),
  entities: [
    { type: 'plate', id: 'l1', x: 11, y: 9 },
    { type: 'plate', id: 'r1', x: 17, y: 9 },
    { type: 'gate', id: 'g1', x: 14, y: 1, h: 9, link: ['l1', 'r1'] },
    { type: 'plate', id: 'l2', x: 24, y: 7 },
    { type: 'plate', id: 'r2', x: 35, y: 9 },
    { type: 'gate', id: 'g2', x: 32, y: 1, h: 9, link: ['l2', 'r2'] },
    { type: 'plate', id: 'l3', x: 40, y: 9, w: 4, need: 'all', latch: true },
    { type: 'gate', id: 'g3', x: 47, y: 1, h: 9, link: ['l3'] },
  ],
};
