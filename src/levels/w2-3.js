import { Grid } from './grid.js';

// Going Up: the freight lift only rises with the whole team aboard,
// and sinks as soon as anyone steps off. Hop off together!
const g = new Grid(40, 12);
g.fill(0, 10, 39, 11, '#');
g.fill(22, 10, 24, 10, '.'); // lift well
g.fill(25, 4, 38, 9, '#'); // upper deck
g.fill(8, 7, 10, 7, '=');
g.set(9, 6, 'K');
g.spawns(1, 9);
g.set(36, 3, 'D');

export default {
  id: 'w2-3',
  world: 2,
  name: 'Going Up',
  hint: 'The lift needs everyone. Step off together!',
  par: 60,
  gold: 25,
  map: g.rows(),
  entities: [{ type: 'lift', id: 'freight', x: 22, w: 3, ax: 22, ay: 10, bx: 22, by: 4, mode: 'weight', need: 'all', speed: 150 }],
};
