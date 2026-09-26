import { Grid } from './grid.js';

// Factory Floor: knock the crate off the shelf, let the belt deliver it to the
// power plate, then catch the freight lift up to the exit deck.
const g = new Grid(48, 14);
g.fill(0, 12, 47, 13, '#');
g.fill(8, 9, 12, 9, '='); // crate shelf
g.fill(13, 12, 16, 12, '>'); // delivery belt
g.set(17, 11, '#'); // belt stop
g.fill(19, 6, 21, 6, '='); // key shelf (bounce height)
g.set(20, 5, 'K');
g.fill(23, 12, 25, 12, '.'); // lift well
g.fill(26, 5, 46, 11, '#'); // exit deck
g.spawns(1, 11);
g.set(44, 4, 'D');

export default {
  id: 'w2-5',
  world: 2,
  name: 'Factory Floor',
  hint: 'Deliver the crate to the power plate to start the lift.',
  par: 90,
  gold: 40,
  map: g.rows(),
  entities: [
    { type: 'crate', id: 'cargo', x: 12, y: 8 },
    { type: 'plate', id: 'power', x: 16, y: 11 },
    { type: 'lift', id: 'freight', x: 23, w: 3, ax: 23, ay: 12, bx: 23, by: 5, mode: 'loop', link: ['power'], dwell: 110, speed: 160 },
  ],
};
