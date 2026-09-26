import { Grid } from './grid.js';

// Canopy Run: the woods' last stretch. Hold the shutter for each other while
// roped together, stack up for the key, then leap the last chasm as one.
const g = new Grid(48, 26);
g.fill(0, 10, 47, 25, '#');
g.fill(21, 7, 23, 7, '='); // key branch, 3 tiles up
g.set(22, 6, 'K');
g.fill(26, 10, 28, 25, '.'); // chasm
g.fill(38, 8, 46, 9, '#'); // raised exit
g.spawns(1, 9);
g.set(44, 7, 'D');

export default {
  id: 'w3-5',
  world: 3,
  name: 'Canopy Run',
  hint: 'Hold the shutter, stack for the key, jump together.',
  par: 90,
  gold: 40,
  tether: true,
  tetherLen: 6,
  map: g.rows(),
  entities: [
    { type: 'plate', id: 'near', x: 7, y: 9 },
    { type: 'plate', id: 'far', x: 13, y: 9 },
    { type: 'gate', id: 'shutter', x: 11, y: 1, h: 9, link: ['near', 'far'] },
  ],
};
