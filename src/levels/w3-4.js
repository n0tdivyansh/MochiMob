import { Grid } from './grid.js';

// Swaying Boughs: two drifting branches ferry the roped team over the gorge.
// Everyone rides together — and hops across together where the branches meet.
const g = new Grid(48, 26);
g.fill(0, 10, 47, 25, '#');
g.fill(12, 10, 32, 25, '.'); // gorge
g.fill(40, 9, 46, 9, '#'); // step up to the exit
g.set(38, 9, 'K');
g.spawns(1, 9);
g.set(44, 8, 'D');

export default {
  id: 'w3-4',
  world: 3,
  name: 'Swaying Boughs',
  hint: 'Ride together. Hop across together.',
  par: 75,
  gold: 30,
  tether: true,
  tetherLen: 6,
  map: g.rows(),
  entities: [
    { type: 'lift', id: 'boughA', x: 12, w: 3, ax: 12, ay: 10, bx: 19, by: 10, mode: 'loop', speed: 130, dwell: 150 },
    { type: 'lift', id: 'boughB', x: 30, w: 3, ax: 30, ay: 10, bx: 23, by: 10, mode: 'loop', speed: 130, dwell: 150 },
  ],
};
