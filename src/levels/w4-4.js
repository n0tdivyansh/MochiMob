import { Grid } from './grid.js';

// Rainbow Tower: three storeys, three colours. On each floor a booth hides
// under coloured glass; only that colour drops in to press the plate that
// opens the shutter to the next cloud ladder.
export const FLOORS = [
  // surface row, booth col (2 wide), shutter col, ladder col (2 wide), ladder rungs, colour slot
  { surface: 21, booth: 8, shutter: 16, ladder: 19, rungs: [19, 17, 16], slot: 0 },
  { surface: 16, booth: 11, shutter: 5, ladder: 1, rungs: [14, 12, 11], slot: 1 },
  { surface: 11, booth: 8, shutter: 16, ladder: 19, rungs: [9, 7, 6], slot: 2 },
];

const g = new Grid(22, 24);
g.fill(0, 21, 21, 23, '#'); // ground
g.fill(1, 16, 20, 17, '#'); // storey 1
g.fill(1, 11, 20, 12, '#'); // storey 2
g.fill(1, 6, 20, 7, '#'); // roof terrace
const entities = [];
FLOORS.forEach((f, k) => {
  g.fill(f.booth, f.surface, f.booth + 1, f.surface, '.'); // booth pocket
  for (const r of f.rungs) g.fill(f.ladder, r, f.ladder + 1, r, '=');
  entities.push(
    { type: 'cgate', x: f.booth, y: f.surface, w: 2, h: 0.25, color: f.slot },
    { type: 'plate', id: `plate${k}`, x: f.booth, y: f.surface, w: 2, latch: true },
    { type: 'gate', id: `shutter${k}`, x: f.shutter, y: f.surface - 3, h: 3, link: [`plate${k}`] },
  );
});
g.set(13, 10, 'K');
g.spawns(1, 20);
g.set(3, 5, 'D');

export default {
  id: 'w4-4',
  world: 4,
  name: 'Rainbow Tower',
  hint: 'Each floor needs a different colour. Find your glass.',
  par: 120,
  gold: 50,
  colorMap: { 2: { 2: 0 } },
  map: g.rows(),
  entities,
};
