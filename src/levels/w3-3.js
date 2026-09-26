import { Grid } from './grid.js';

// Leap of Faith: the chasm is too wide to jump. Squish at the edge so friends
// can bounce across, then trust the rope as they haul you over.
const g = new Grid(48, 26);
g.fill(0, 10, 47, 25, '#');
g.fill(16, 10, 20, 25, '.'); // 5-wide chasm
g.set(32, 9, 'K');
g.spawns(1, 9);
g.set(45, 9, 'D');

export default {
  id: 'w3-3',
  world: 3,
  name: 'Leap of Faith',
  hint: 'Too far to jump? Bounce off a squished friend.',
  par: 75,
  gold: 30,
  tether: true,
  tetherLen: 12,
  map: g.rows(),
  entities: [],
};
