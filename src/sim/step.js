import { controlBlob } from './blob.js';
import { integrate } from './physics.js';

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
  const bits = normalizeInputs(state, inputs);

  for (const b of state.blobs) {
    const cur = bits[b.i];
    const pressed = cur & ~b.prev;
    if (b.alive && !b.inDoor) controlBlob(state, b, cur, pressed);
  }

  integrate(state);

  for (const b of state.blobs) b.prev = bits[b.i];
  state.tick++;
}
