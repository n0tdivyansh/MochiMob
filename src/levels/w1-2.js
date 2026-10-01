import { Grid } from './grid.js';

// Bounce House: the key floats on a cloud shelf far too high to jump to.
// Squish flat and let a friend bounce off you.
const g = new Grid(40, 14);
g.fill(0, 12, 39, 13, '#');
g.fill(16, 6, 18, 6, '='); // cloud shelf, 6 tiles up
g.set(17, 5, 'K');
g.fill(24, 11, 25, 11, '^'); // spike strip (2 wide: a 3-wide strip left a ~4-frame jump window)
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
  prompts: [
    { x: 8, y: 9.5, keys: ['S'], text: 'Squish: friends bounce off you' },
    { x: 8, y: 7.9, keys: ['S', 'E'], text: 'Hold S, tap E: they stay squished' },
  ],
};
