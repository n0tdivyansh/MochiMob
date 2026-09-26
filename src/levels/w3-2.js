import { Grid } from './grid.js';

// Anchor Down: the key hangs deep in a narrow well. Step off the edge — your
// friend's rope will hold you — grab it, and let them haul you back out.
const g = new Grid(44, 20);
g.fill(0, 10, 43, 19, '#');
g.fill(14, 10, 15, 19, '.'); // the well
g.set(14, 12, 'K');
g.fill(26, 10, 28, 19, '.'); // chasm
g.spawns(1, 9);
g.set(41, 9, 'D');

export default {
  id: 'w3-2',
  world: 3,
  name: 'Anchor Down',
  hint: 'Walk off the edge on purpose. The rope has you.',
  par: 60,
  gold: 25,
  tether: true,
  tetherLen: 4,
  map: g.rows(),
  entities: [],
};
