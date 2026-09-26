import { Grid } from './grid.js';

// All Aboard: the heavy plate sits in a narrow trough and only latches when the
// whole team is on it. Big teams have to pile up.
const g = new Grid(44, 12);
g.fill(0, 10, 43, 11, '#');
g.fill(12, 10, 13, 10, '.'); // two-wide trough
g.fill(26, 7, 28, 7, '='); // key shelf, 3 tiles up
g.set(27, 6, 'K');
g.spawns(1, 9);
g.set(41, 9, 'D');

export default {
  id: 'w2-2',
  world: 2,
  name: 'All Aboard',
  hint: 'Everybody in! Stack up if it gets crowded.',
  par: 60,
  gold: 25,
  map: g.rows(),
  entities: [
    { type: 'plate', id: 'heavy', x: 12, y: 10, w: 2, need: 'all', latch: true },
    { type: 'gate', id: 'shutter', x: 18, y: 1, h: 9, link: ['heavy'] },
  ],
};
