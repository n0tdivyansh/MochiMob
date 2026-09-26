import { Grid } from './grid.js';

// Tower of Mochi: climb three tiers. Whoever gets up first kicks jelly crates
// down so the rest of the team can follow.
const g = new Grid(40, 30);
g.fill(0, 28, 39, 29, '#'); // ground
g.fill(13, 25, 38, 27, '#'); // tier 1 (3 tiles up: stack to reach)
g.fill(27, 21, 38, 24, '#'); // tier 2 (4 tiles up: bounce to reach)
g.fill(34, 19, 35, 19, '='); // cloud ladder: jump straight up through each rung
g.fill(34, 17, 35, 17, '=');
g.fill(34, 15, 35, 15, '=');
g.fill(34, 13, 35, 13, '=');
g.fill(24, 13, 33, 13, '#'); // summit stairs
g.fill(29, 17, 33, 17, '=');
g.fill(35, 15, 38, 15, '=');
g.fill(24, 13, 33, 13, '#'); // summit
g.set(20, 24, 'C');
g.set(37, 20, 'C');
g.set(30, 12, 'K');
g.set(25, 12, 'D');
g.spawns(1, 27);

export default {
  id: 'w1-5',
  world: 1,
  name: 'Tower of Mochi',
  hint: 'First one up: kick the crates down for your friends.',
  par: 150,
  gold: 60,
  map: g.rows(),
  entities: [
    { type: 'crate', id: 'c1', x: 16, y: 24 },
    { type: 'crate', id: 'c2', x: 29, y: 20 },
    { type: 'crate', id: 'c3', x: 32, y: 20 },
  ],
};
