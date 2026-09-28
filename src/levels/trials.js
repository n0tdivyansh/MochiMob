// Solo Trials: levels built for a single mochi (team size 1).
import { Grid } from './grid.js';

const trial = (id, name, theme, hint, par, gold, g, entities = []) => ({
  id, world: 5, trial: true, theme, name, hint, par, gold, map: g.rows(), entities,
});

// t-1 Hop Along: bumps, a gap, spikes and a ledge.
function hopAlong() {
  const g = new Grid(40, 12);
  g.fill(0, 10, 39, 11, '#');
  g.set(6, 9, '#');
  g.fill(10, 8, 11, 9, '#');
  g.fill(15, 10, 17, 11, '.');
  g.fill(21, 9, 22, 9, '^');
  g.fill(26, 8, 28, 9, '#');
  g.set(27, 7, 'K');
  g.spawns(1, 9);
  g.set(37, 9, 'D');
  return trial('t-1', 'Hop Along', 'meadow', 'Hold jump for a higher hop.', 40, 15, g);
}

// t-2 Spring Garden: bounce pads carry you up two tiers.
function springGarden() {
  const g = new Grid(32, 16);
  g.fill(0, 14, 31, 15, '#');
  g.set(8, 13, 'B');
  g.fill(10, 10, 16, 13, '#');
  g.set(15, 9, 'B');
  g.fill(18, 6, 30, 13, '#');
  g.set(21, 5, 'K');
  g.spawns(1, 13);
  g.set(28, 5, 'D');
  return trial('t-2', 'Spring Garden', 'meadow', 'Land on a spring to fly high.', 45, 15, g);
}

// t-3 Crate Mate: push the crate to the cliff and use it as a step.
function crateMate() {
  const g = new Grid(36, 12);
  g.fill(0, 10, 35, 11, '#');
  g.fill(18, 7, 35, 9, '#');
  g.set(25, 6, 'K');
  g.spawns(1, 9);
  g.set(32, 6, 'D');
  return trial('t-3', 'Crate Mate', 'works', 'Too high? Bring a crate.', 45, 18, g, [{ type: 'crate', id: 'step', x: 8, y: 9 }]);
}

// t-4 Belt Run: fight a belt, then squish and ride under a wall.
function beltRun() {
  const g = new Grid(44, 12);
  g.fill(0, 10, 43, 11, '#');
  g.fill(8, 10, 14, 10, '<');
  g.fill(20, 10, 26, 10, '>');
  g.fill(22, 1, 24, 8, '#');
  g.fill(22, 9, 24, 9, 'v');
  g.fill(30, 9, 31, 9, '^');
  g.set(36, 9, 'K');
  g.spawns(1, 9);
  g.set(41, 9, 'D');
  return trial('t-4', 'Belt Run', 'works', 'Squish on the belt to slide under the wall.', 50, 20, g);
}

// t-5 Heavy Thoughts: park the crate on the plate to keep the shutter open.
function heavyThoughts() {
  const g = new Grid(40, 12);
  g.fill(0, 10, 39, 11, '#');
  g.fill(25, 8, 27, 9, '#');
  g.set(26, 7, 'K');
  g.spawns(1, 9);
  g.set(37, 9, 'D');
  return trial('t-5', 'Heavy Thoughts', 'works', 'A crate can stand on a plate for you.', 50, 20, g, [
    { type: 'crate', id: 'weight', x: 6, y: 9 },
    { type: 'plate', id: 'hold', x: 12, y: 9 },
    { type: 'gate', id: 'shutter', x: 18, y: 1, h: 9, link: ['hold'] },
  ]);
}

// t-6 Lift Off: ride two drifting platforms over a spike carpet.
function liftOff() {
  const g = new Grid(48, 14);
  g.fill(0, 12, 47, 13, '#');
  g.fill(12, 11, 33, 11, '^');
  g.set(38, 11, 'K');
  g.spawns(1, 11);
  g.set(45, 11, 'D');
  return trial('t-6', 'Lift Off', 'woods', 'Wait for the platforms to line up.', 60, 25, g, [
    { type: 'lift', id: 'a', x: 11, w: 3, ax: 11, ay: 11.5, bx: 18, by: 11.5, mode: 'loop', speed: 130, dwell: 120 },
    { type: 'lift', id: 'b', x: 29, w: 3, ax: 29, ay: 11.5, bx: 22, by: 11.5, mode: 'loop', speed: 130, dwell: 120 },
  ]);
}

// t-7 Paint Job: repaint yourself to get through each glass wall.
function paintJob() {
  const g = new Grid(44, 12);
  g.fill(0, 10, 43, 11, '#');
  g.fill(5, 8, 7, 9, '#');
  g.fill(14, 8, 16, 9, '#');
  g.set(36, 9, 'K');
  g.spawns(1, 9);
  g.set(41, 9, 'D');
  return trial('t-7', 'Paint Job', 'peaks', 'Walk through paint to change colour.', 45, 18, g, [
    { type: 'paint', x: 6, y: 7, color: 1 },
    { type: 'cgate', x: 10, y: 1, h: 9, color: 1 },
    { type: 'paint', x: 15, y: 7, color: 2 },
    { type: 'cgate', x: 19, y: 1, h: 9, color: 2 },
    { type: 'paint', x: 23, y: 9, color: 0 },
    { type: 'plate', id: 'pink', x: 27, y: 9, color: 0, latch: true },
    { type: 'gate', id: 'shutter', x: 31, y: 1, h: 9, link: ['pink'] },
  ]);
}

// t-8 Lonely Summit: spring, crate, plate, belt, all in one climb.
function lonelySummit() {
  const g = new Grid(44, 16);
  g.fill(0, 14, 43, 15, '#');
  g.set(6, 13, 'B');
  g.fill(8, 10, 16, 13, '#');
  g.set(11, 9, 'C');
  g.fill(23, 14, 29, 14, '>');
  g.fill(25, 1, 27, 12, '#');
  g.fill(25, 13, 27, 13, 'v');
  g.set(34, 13, 'K');
  g.spawns(1, 13);
  g.set(40, 13, 'D');
  return trial('t-8', 'Lonely Summit', 'peaks', 'Spring up, drop the crate, ride the belt.', 75, 30, g, [
    { type: 'crate', id: 'drop', x: 14, y: 9 },
    { type: 'plate', id: 'hold', x: 17, y: 13, latch: true },
    { type: 'gate', id: 'shutter', x: 21, y: 1, h: 13, link: ['hold'] },
  ]);
}

export const TRIAL_WORLD = { id: 5, name: 'Solo Trials', theme: 'meadow' };
export const TRIALS = [hopAlong(), springGarden(), crateMate(), beltRun(), heavyThoughts(), liftOff(), paintJob(), lonelySummit()];
