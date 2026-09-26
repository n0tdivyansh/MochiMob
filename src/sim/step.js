import { controlBlob } from './blob.js';
import { integrate } from './physics.js';
import { computePushes, moveLifts } from './objects.js';
import { updatePlates, updateGates, updatePaint, recoverCrates } from './logic.js';
import {
  tickRespawns, checkHazards, updateSafeSpots, updateCheckpoints, updateKey, doorInputs, checkClear,
} from './flow.js';
import { soloInputs, soloAfterDoor } from './solo.js';
import { applyTether } from './tether.js';

function normalizeInputs(state, inputs) {
  const out = new Array(state.n).fill(0);
  if (typeof inputs === 'number') {
    out[0] = inputs & 31;
    return out;
  }
  if (Array.isArray(inputs)) for (let i = 0; i < state.n; i++) out[i] = (inputs[i] | 0) & 31;
  return out;
}

// Advance the simulation by exactly one tick.
export function step(state, inputs) {
  state.events = [];
  tickRespawns(state);
  const bits = state.solo
    ? soloInputs(state, typeof inputs === 'number' ? inputs : Array.isArray(inputs) ? inputs[0] | 0 : 0)
    : normalizeInputs(state, inputs);
  const pressedOf = (b) => bits[b.i] & ~b.prev;

  const usedDoor = doorInputs(state, bits, pressedOf);
  if (state.solo) soloAfterDoor(state);

  for (const b of state.blobs) {
    if (!b.alive || b.inDoor || usedDoor.has(b.i)) continue;
    controlBlob(state, b, bits[b.i], pressedOf(b));
  }

  computePushes(state);
  integrate(state, moveLifts);
  applyTether(state);
  updatePlates(state);
  updateGates(state);
  updatePaint(state);
  recoverCrates(state);

  checkHazards(state);
  updateSafeSpots(state);
  updateCheckpoints(state);
  updateKey(state);
  checkClear(state);

  for (const b of state.blobs) b.prev = bits[b.i];
  state.tick++;
}
