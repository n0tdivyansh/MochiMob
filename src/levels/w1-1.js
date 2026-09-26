import { Grid } from './grid.js';

// First Steps: walk, hop a bump, jump a pit, then stack up to reach the key shelf.
const g = new Grid(36, 12);
g.fill(0, 10, 35, 11, '#'); // floor
g.fill(13, 10, 15, 11, '.'); // pit
g.set(7, 9, '#'); // bump
g.fill(19, 7, 21, 7, '='); // key shelf (3 tiles up: needs a friend to stand on)
g.set(20, 6, 'K');
g.spawns(1, 9);
g.set(33, 9, 'D');

export default {
  id: 'w1-1',
  world: 1,
  name: 'First Steps',
  hint: 'Hop on a friend to reach the key!',
  par: 45,
  gold: 20,
  map: g.rows(),
  entities: [],
};
