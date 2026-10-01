import { Grid } from './grid.js';

// True Colors: each glass bridge is solid to everyone except its own colour.
// Drop through yours to reach what is hidden underneath.
const g = new Grid(44, 16);
g.fill(0, 12, 43, 15, '#');
const booths = [8, 14, 20, 26];
for (const c of booths) g.fill(c, 12, c + 1, 13, '.'); // booth under each bridge
g.set(8, 13, 'K');
g.spawns(1, 11);
g.set(40, 11, 'D');

const bridge = (slot, minPlayers) => ({ type: 'cgate', x: booths[slot], y: 12, w: 2, h: 0.25, color: slot, minPlayers });
const plate = (slot, minPlayers) => ({ type: 'plate', id: `p${slot}`, x: booths[slot], y: 13, w: 2, latch: true, minPlayers });

export default {
  id: 'w4-1',
  world: 4,
  name: 'True Colors',
  hint: 'Your colour passes through your glass. Look for your symbol.',
  par: 60,
  gold: 25,
  map: g.rows(),
  entities: [
    bridge(0),
    bridge(1),
    plate(1),
    bridge(2, 3),
    plate(2, 3),
    bridge(3, 4),
    plate(3, 4),
    { type: 'gate', id: 'shutter', x: 32, y: 1, h: 11, link: ['p1', 'p2', 'p3'], mode: 'all' },
  ],
  prompts: [
    { x: 5, y: 9.5, keys: [], text: 'Your colour drops through its glass' },
  ],
};
