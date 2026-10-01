import { Grid } from './grid.js';

// Press Here: a shutter blocks the hall. A plate on each side holds it open,
// so someone always has to stay behind until a friend returns the favour.
const g = new Grid(40, 12);
g.fill(0, 10, 39, 11, '#');
g.fill(30, 8, 32, 9, '#'); // crate-shaped step with the key on top
g.set(31, 7, 'K');
g.spawns(1, 9);
g.set(37, 9, 'D');

export default {
  id: 'w2-1',
  world: 2,
  name: 'Press Here',
  hint: 'Stand on the plate to hold the shutter open.',
  par: 60,
  gold: 25,
  map: g.rows(),
  entities: [
    { type: 'plate', id: 'a', x: 16, y: 9 },
    { type: 'plate', id: 'b', x: 24, y: 9 },
    { type: 'gate', id: 'shutter', x: 20, y: 1, h: 9, link: ['a', 'b'] },
  ],
  prompts: [
    { x: 16.5, y: 7.5, keys: [], text: 'Stand here to hold the shutter' },
  ],
};
