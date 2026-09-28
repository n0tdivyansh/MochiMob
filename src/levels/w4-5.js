import { Grid } from './grid.js';

// Summit: everything you have learned. Bounce for the key, slip through the
// green glass to power the lift, ride up together, and turn pink for the finale.
const g = new Grid(56, 16);
g.fill(0, 12, 55, 15, '#');
g.fill(8, 6, 10, 6, '='); // key shelf (bounce height)
g.set(9, 5, 'K');
g.fill(16, 12, 17, 13, '.'); // power booth under green glass
g.fill(24, 12, 26, 12, '.'); // lift well
g.fill(27, 5, 54, 11, '#'); // summit deck
g.spawns(1, 11);
g.set(50, 4, 'D');

export default {
  id: 'w4-5',
  world: 4,
  name: 'Summit',
  hint: 'Bounce, glass, lift, paint. You know what to do.',
  par: 120,
  gold: 50,
  map: g.rows(),
  entities: [
    { type: 'cgate', x: 16, y: 12, w: 2, h: 0.25, color: 1 },
    { type: 'plate', id: 'power', x: 16, y: 13, w: 2, latch: true },
    { type: 'lift', id: 'freight', x: 24, w: 3, ax: 24, ay: 12, bx: 24, by: 5, mode: 'loop', link: ['power'], dwell: 120, speed: 160 },
    { type: 'paint', x: 32, y: 4, color: 0 },
    { type: 'cgate', x: 38, y: 1, h: 4, color: 0 },
  ],
};
