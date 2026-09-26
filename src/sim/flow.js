import { TILE, T, SPIKE_H, RESPAWN_TICKS, KEY_LERP, BLOB_H, INPUT } from './constants.js';
import { overlap, hOverlapLen } from './geom.js';
import { tileAt, overlapsSolid } from './collide.js';

const KEY_SIZE = 28;
const SPIKE_INSET = 8;

function center(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

export function kill(state, b, cause) {
  if (!b.alive) return;
  b.alive = false;
  b.deadT = RESPAWN_TICKS;
  b.vx = 0;
  b.vy = 0;
  b.support = null;
  b.grounded = false;
  if (b.squish) {
    b.y -= BLOB_H - b.h;
    b.h = BLOB_H;
    b.squish = false;
  }
  state.events.push({ type: 'die', i: b.i, cause, x: b.x + b.w / 2, y: b.y + b.h / 2, color: b.color });
  if (state.key.holder === b.i) {
    state.key.holder = -1;
    state.key.x = b.lastSafe.x + b.w / 2;
    state.key.y = b.lastSafe.y - 20;
    state.events.push({ type: 'keyDrop', x: state.key.x, y: state.key.y });
  }
}

// Place a body at (x, y) or the nearest free spot: stacked upward, then sideways.
export function placeFree(state, b, x, y) {
  const tries = [];
  for (let k = 0; k <= 5; k++) tries.push([0, -50 * k]);
  for (const dx of [60, -60, 120, -120]) for (let k = 0; k <= 3; k++) tries.push([dx, -50 * k]);
  for (const [dx, dy] of tries) {
    b.x = x + dx;
    b.y = y + dy;
    if (!overlapsSolid(state, b)) return true;
  }
  b.x = x;
  b.y = y;
  return false;
}

function respawnPoint(state, b) {
  if (state.respawn) return { x: state.respawn.x - b.w / 2, y: state.respawn.y - b.h };
  return { x: state.spawns[b.i].x, y: state.spawns[b.i].y };
}

export function tickRespawns(state) {
  for (const b of state.blobs) {
    if (b.alive) continue;
    if (--b.deadT > 0) continue;
    const p = respawnPoint(state, b);
    b.alive = true;
    b.vx = 0;
    b.vy = 0;
    b.jumpBuf = 0;
    b.coyote = 0;
    placeFree(state, b, p.x, p.y);
    b.lastSafe = { x: b.x, y: b.y };
    state.events.push({ type: 'respawn', i: b.i, x: b.x + b.w / 2, y: b.y + b.h / 2 });
  }
}

function touchesSpikes(state, b) {
  const c0 = Math.floor(b.x / TILE);
  const c1 = Math.floor((b.x + b.w - 1e-6) / TILE);
  const r0 = Math.floor(b.y / TILE);
  const r1 = Math.floor((b.y + b.h - 1e-6) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (tileAt(state, c, r) !== T.SPIKES) continue;
      const rect = { x: c * TILE + SPIKE_INSET, y: (r + 1) * TILE - SPIKE_H, w: TILE - 2 * SPIKE_INSET, h: SPIKE_H };
      if (overlap(rect, b)) return true;
    }
  }
  return false;
}

export function checkHazards(state) {
  const floor = state.static.H + 100;
  for (const b of state.blobs) {
    if (!b.alive || b.inDoor) continue;
    if (b.y > floor) kill(state, b, 'fall');
    else if (touchesSpikes(state, b)) kill(state, b, 'spikes');
  }
}

export function updateSafeSpots(state) {
  for (const b of state.blobs) {
    if (!b.alive || b.inDoor || !b.grounded || !b.support) continue;
    const k = b.support.kind;
    if (k === 'tile' || k === 'lift') b.lastSafe = { x: b.x, y: b.y };
  }
}

export function updateCheckpoints(state) {
  for (const cp of state.checkpoints) {
    if (cp.active) continue;
    const zone = { x: cp.x - 32, y: cp.y - 128, w: 64, h: 128 };
    const toucher = state.blobs.find((b) => b.alive && !b.inDoor && overlap(b, zone));
    if (!toucher) continue;
    for (const other of state.checkpoints) other.active = false;
    cp.active = true;
    state.respawn = { x: cp.x, y: cp.y };
    state.events.push({ type: 'checkpoint', i: toucher.i, x: cp.x, y: cp.y });
  }
}

export function updateKey(state) {
  const key = state.key;
  if (key.holder === -1) {
    const rect = { x: key.x - KEY_SIZE / 2, y: key.y - KEY_SIZE / 2, w: KEY_SIZE, h: KEY_SIZE };
    const taker = state.blobs.find((b) => b.alive && !b.inDoor && overlap(b, rect));
    if (taker) {
      key.holder = taker.i;
      state.events.push({ type: 'key', i: taker.i, x: key.x, y: key.y });
    }
  }
  if (key.holder >= 0) {
    const h = state.blobs[key.holder];
    const c = center(h);
    const tx = c.x - h.facing * 36;
    const ty = h.y - 44 + h.h / 2;
    key.x += (tx - key.x) * KEY_LERP;
    key.y += (ty - key.y) * KEY_LERP;
    if (!state.door.open && overlap(h, state.door)) {
      state.door.open = true;
      key.holder = -2;
      key.x = state.door.x + state.door.w / 2;
      key.y = state.door.y + state.door.h / 2;
      state.events.push({ type: 'unlock', i: h.i, x: key.x, y: key.y });
    }
  }
}

function atDoor(state, b) {
  return overlap(b, state.door) && hOverlapLen(b, state.door) >= b.w / 2;
}

// UP pressed at the open door enters it; UP pressed while inside steps back out.
// Returns the set of blob indices that used their input on the door this tick.
export function doorInputs(state, bits, pressedOf) {
  const used = new Set();
  if (!state.door.open || state.cleared) return used;
  for (const b of state.blobs) {
    if (!b.alive) continue;
    const pressed = pressedOf(b);
    if (!(pressed & INPUT.UP)) continue;
    if (b.inDoor) {
      b.inDoor = false;
      const d = state.door;
      placeFree(state, b, d.x + (d.w - b.w) / 2, d.y + d.h - b.h);
      b.vx = 0;
      b.vy = 0;
      used.add(b.i);
      state.events.push({ type: 'exit', i: b.i, x: b.x + b.w / 2, y: b.y + b.h });
    } else if (!b.squish && atDoor(state, b)) {
      b.inDoor = true;
      b.vx = 0;
      b.vy = 0;
      b.support = null;
      b.grounded = false;
      if (state.key.holder === b.i) state.key.holder = -2;
      used.add(b.i);
      state.events.push({ type: 'enter', i: b.i, x: b.x + b.w / 2, y: b.y + b.h });
    }
  }
  return used;
}

export function checkClear(state) {
  if (state.cleared) return;
  if (state.blobs.every((b) => b.inDoor)) {
    state.cleared = true;
    state.events.push({ type: 'clear', tick: state.tick });
  }
}
