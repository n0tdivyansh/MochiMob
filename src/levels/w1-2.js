import { Grid } from './grid.js';

// Bounce House: the key floats on a cloud shelf far too high to jump to.
// Squish flat and let a friend bounce off you.
const g = new Grid(40, 14);
g.fill(0, 12, 39, 13, '#');
g.fill(16, 6, 18, 6, '='); // cloud shelf, 6 tiles up
g.set(17, 5, 'K');
g.fill(24, 11, 26, 11, '^'); // spike strip
g.fill(30, 10, 39, 11, '#'); // raised landing
g.spawns(1, 11);
g.set(37, 9, 'D');

export default {
  id: 'w1-2',
  world: 1,
  name: 'Bounce House',
  hint: 'Hold down to squish. Friends who land on you go flying!',
  par: 50,
  gold: 22,
  map: g.rows(),
  entities: [],
};
