import { Grid } from './grid.js';

// Low Road: only a squished blob fits under the wall — let the conveyor carry you.
// On the far side, the key floats on a shelf that needs a bounce.
const g = new Grid(48, 14);
g.fill(0, 12, 47, 13, '#');
g.fill(14, 1, 20, 10, '#'); // wall
g.fill(14, 11, 20, 11, 'v'); // low gap under the wall
g.fill(12, 12, 22, 12, '>'); // conveyor through the gap
g.fill(28, 6, 30, 6, '='); // key shelf
g.set(29, 5, 'K');
g.fill(35, 11, 36, 11, '^'); // 2 wide: 3 left a ~4-frame jump window
g.spawns(1, 11);
g.set(45, 11, 'D');

export default {
  id: 'w1-4',
  world: 1,
  name: 'Low Road',
  hint: 'Squish on the belt to slide under the wall.',
  par: 70,
  gold: 30,
  map: g.rows(),
  entities: [],
  prompts: [
    { x: 7, y: 9.5, keys: ['S'], text: 'Squish to slide under' },
  ],
};
