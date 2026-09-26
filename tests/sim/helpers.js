import { createWorld } from '../../src/sim/world.js';
import { step } from '../../src/sim/step.js';

// 20x6 room, floor top at y=320, 4 spawns in columns 1-4.
export const ROOM = [
  '####################',
  '#..................#',
  '#..................#',
  '#..................#',
  '#SSSS.........K..D.#',
  '####################',
];

export function makeDef(map = ROOM, entities = [], extra = {}) {
  return { id: 'test', world: 1, name: 'Test', par: 60, gold: 30, map, entities, ...extra };
}

// Replace the character at (col,row) of a map.
export function put(map, col, row, ch) {
  return map.map((line, r) => (r === row ? line.slice(0, col) + ch + line.slice(col + 1) : line));
}

export function world(map = ROOM, entities = [], n = 2, opts = {}, extra = {}) {
  return createWorld(makeDef(map, entities, extra), n, opts);
}

// Run `ticks` steps; inputsFn(tick, state) returns the inputs argument for step.
export function run(state, ticks, inputsFn = () => new Array(state.n).fill(0)) {
  for (let t = 0; t < ticks; t++) step(state, inputsFn(t, state));
  return state;
}

// Collect all events emitted during a run.
export function runEvents(state, ticks, inputsFn) {
  const events = [];
  for (let t = 0; t < ticks; t++) {
    step(state, inputsFn ? inputsFn(t, state) : new Array(state.n).fill(0));
    events.push(...state.events);
  }
  return events;
}
