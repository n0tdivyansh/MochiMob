import { Grid } from './grid.js';

// Paint Party: the big plate only counts pink, the far curtain only lets green
// through. Splash through the paint pools to become whatever the room needs.
const g = new Grid(48, 14);
g.fill(0, 12, 47, 13, '#');
g.set(22, 11, 'K');
g.spawns(1, 11);
g.set(44, 11, 'D');

export default {
  id: 'w4-2',
  world: 4,
  name: 'Paint Party',
  hint: 'Walk through paint to change colour.',
  par: 60,
  gold: 25,
  map: g.rows(),
  entities: [
    { type: 'paint', x: 8, y: 11, color: 0 },
    { type: 'plate', id: 'pink', x: 12, y: 11, w: 4, need: 'all', color: 0, latch: true },
    { type: 'gate', id: 'shutter', x: 18, y: 1, h: 11, link: ['pink'] },
    { type: 'paint', x: 26, y: 11, color: 1 },
    { type: 'cgate', x: 30, y: 1, h: 11, color: 1 },
  ],
  prompts: [
    { x: 6, y: 9.5, keys: [], text: 'Walk through paint to change colour' },
  ],
};
