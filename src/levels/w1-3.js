import { Grid } from './grid.js';

// Heavy Pudding: a jelly crate plugs the tunnel. It only budges when the whole
// team pushes together — then it becomes the step up to the exit.
const g = new Grid(44, 12);
g.fill(0, 10, 43, 11, '#');
g.fill(10, 1, 22, 8, '#'); // rock mass with a one-tile tunnel on row 9
g.set(20, 9, 'K'); // key waits inside the tunnel
g.fill(31, 7, 43, 9, '#'); // exit ledge, 3 tiles up
g.spawns(1, 9);
g.set(40, 6, 'D');

export default {
  id: 'w1-3',
  world: 1,
  name: 'Heavy Pudding',
  hint: 'Everyone push at once!',
  par: 60,
  gold: 25,
  map: g.rows(),
  entities: [{ type: 'crate', id: 'pudding', x: 11, y: 9, weight: 'players' }],
};
