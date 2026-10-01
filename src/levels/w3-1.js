import { Grid } from './grid.js';

// Tied Together: everyone is roped to the next blob. Jump the chasms as a team —
// if someone slips, the rope holds and a friend can haul them back up.
const g = new Grid(60, 20);
g.fill(0, 10, 59, 19, '#'); // deep earth, so a dangling friend never drops out of the world
g.fill(12, 10, 14, 19, '.'); // 3-wide chasm
g.fill(30, 10, 33, 19, '.'); // 4-wide chasm
g.fill(48, 8, 58, 9, '#'); // raised exit
g.set(40, 9, 'K');
g.spawns(1, 9);
g.set(56, 7, 'D');

export default {
  id: 'w3-1',
  world: 3,
  name: 'Tied Together',
  hint: 'The rope keeps you close. If a friend slips, walk away to haul them up.',
  par: 60,
  gold: 25,
  tether: true,
  tetherLen: 8,
  map: g.rows(),
  entities: [],
  prompts: [
    { x: 6, y: 7.5, keys: [], text: 'The rope keeps you together' },
  ],
};
