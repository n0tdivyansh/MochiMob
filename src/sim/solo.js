import { TILE, T, INPUT, FOLLOW_STOP, FRICTION } from './constants.js';
import { solidsFor, tileAt } from './collide.js';

const JUMP_HOLD = 14;

function selectable(state, i, allowInDoor) {
  const b = state.blobs[i];
  return !!b && b.alive && (allowInDoor || !b.inDoor);
}

// Solo team commands: 'next' | 'prev' | 'follow' | blob index.
export function soloCommand(state, cmd) {
  const s = state.solo;
  if (!s) return;
  if (cmd === 'follow') {
    s.follow = !s.follow;
    state.events.push({ type: 'follow', on: s.follow });
    return;
  }
  let target = -1;
  if (typeof cmd === 'number') {
    if (cmd >= 0 && cmd < state.n && selectable(state, cmd, true)) target = cmd;
  } else if (cmd === 'next' || cmd === 'prev') {
    const dir = cmd === 'next' ? 1 : -1;
    for (let k = 1; k < state.n; k++) {
      const i = (s.active + dir * k + state.n * 4) % state.n;
      if (selectable(state, i, false)) {
        target = i;
        break;
      }
    }
  }
  if (target >= 0 && target !== s.active) {
    s.active = target;
    state.events.push({ type: 'swap', active: target });
  }
}

function staticBlocked(state, b, rect) {
  return solidsFor(state, b, rect, { dynamic: false }).some((r) => !r.oneWay);
}

function floorBelow(state, b, x) {
  const probe = { x: x - 1, y: b.y + b.h, w: 2, h: 10 };
  if (solidsFor(state, b, probe).length > 0) return true;
  return false;
}

function hazardAhead(state, b, dir) {
  const x = dir > 0 ? b.x + b.w + 8 : b.x - 8;
  const c = Math.floor(x / TILE);
  const r = Math.floor((b.y + b.h - 1) / TILE);
  return tileAt(state, c, r) === T.SPIKES;
}

// Input bits for an idle follower walking toward the active blob.
function followBits(state, b, t) {
  const ai = b.ai;
  let bits = 0;
  if (ai.jumpT > 0) {
    ai.jumpT--;
    bits |= INPUT.JUMP;
  }
  if (!t.alive || t.inDoor || !b.alive) return bits;
  const dx = t.x + t.w / 2 - (b.x + b.w / 2);
  const targetBelow = t.y + t.h >= b.y + b.h + 32;
  const canStartJump = b.grounded && ai.jumpT === 0 && !(b.prev & INPUT.JUMP);
  let wantJump = false;

  const brake = (b.vx * b.vx) / (2 * FRICTION);
  // Far away: walk toward the leader. Close: copy the leader's direction so
  // followers push crates and walk alongside instead of blocking.
  const far = Math.abs(dx) > FOLLOW_STOP + brake;
  const mimic = !far && t.dir !== 0 && t.grounded && b.grounded;
  if (far || mimic) {
    const dir = far ? Math.sign(dx) : t.dir;
    // Look ahead by the braking distance so the follower stops before the edge.
    const look = 8 + brake;
    const footX = dir > 0 ? b.x + b.w + look : b.x - look;
    const ledge = b.grounded && !floorBelow(state, b, footX);
    const danger = hazardAhead(state, b, dir);
    if ((ledge && !targetBelow) || danger) {
      // stay put at the edge
    } else {
      bits |= dir > 0 ? INPUT.RIGHT : INPUT.LEFT;
    }
    const front = { x: dir > 0 ? b.x + b.w : b.x - 4, y: b.y + 2, w: 4, h: b.h - 4 };
    if (staticBlocked(state, b, front)) {
      const high = { x: front.x, y: b.y - TILE, w: 4, h: b.h };
      if (!staticBlocked(state, b, high)) wantJump = true;
    }
  }
  // Only hop up to a leader who is standing on something (never chase a mid-air jump).
  if (t.grounded && t.y + t.h < b.y + b.h - 40 && Math.abs(dx) < 160) wantJump = true;
  if (wantJump && canStartJump) {
    ai.jumpT = JUMP_HOLD;
    bits |= INPUT.JUMP;
  }
  return bits;
}

// Per-blob inputs for a solo tick: the player drives the active blob only.
export function soloInputs(state, playerBits) {
  const s = state.solo;
  const out = new Array(state.n).fill(0);
  const active = state.blobs[s.active];
  for (const b of state.blobs) {
    if (b.i === s.active) {
      out[b.i] = playerBits & 31;
      continue;
    }
    if (!b.alive || b.inDoor) continue;
    if (b.squish) out[b.i] = INPUT.SQUISH;
    else if (s.follow) out[b.i] = followBits(state, b, active);
    else b.ai.jumpT = 0;
  }
  return out;
}

export function soloAfterDoor(state) {
  const s = state.solo;
  if (s && state.blobs[s.active].inDoor) soloCommand(state, 'next');
}
