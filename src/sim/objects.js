import { DT, PUSH_SPEED } from './constants.js';
import { overlap } from './geom.js';
import { pushRidersUp, bodyOf, dynamicBodies } from './physics.js';

// ---------- Crates ----------

function vOverlap(a, b) {
  return Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
}

// Blobs pressing toward `rect` from the side opposite `dir`, touching it.
function pushersAgainst(state, rect, dir, taken) {
  const out = [];
  for (const b of state.blobs) {
    if (!b.alive || b.inDoor || b.squish || !b.grounded || b.dir !== dir || taken.has(b)) continue;
    if (vOverlap(b, rect) < 8) continue;
    const gap = dir > 0 ? rect.x - (b.x + b.w) : b.x - (rect.x + rect.w);
    if (Math.abs(gap) <= 1) out.push(b);
  }
  return out;
}

// Decide which crates move this tick. A crate moves when the chain of
// grounded blobs pushing it in one direction is at least its weight.
export function computePushes(state) {
  for (const crate of state.crates) {
    crate.pushDir = 0;
    if (!crate.grounded) continue;
    for (const dir of [1, -1]) {
      const chain = new Set();
      let frontier = [crate];
      while (frontier.length) {
        const next = [];
        for (const r of frontier) for (const b of pushersAgainst(state, r, dir, chain)) {
          chain.add(b);
          next.push(b);
        }
        frontier = next;
      }
      if (chain.size >= crate.weight) {
        crate.pushDir = dir;
        for (const b of chain) b.vx = dir * PUSH_SPEED;
        state.events.push({ type: 'push', idx: crate.idx, dir });
        break;
      }
    }
  }
}

// ---------- Lifts ----------

function supportChainEndsAt(state, body, lift) {
  let cur = body;
  for (let depth = 0; depth < 8 && cur && cur.support; depth++) {
    const s = cur.support;
    if (s.kind === 'lift') return s.idx === lift.idx;
    if (s.kind !== 'blob' && s.kind !== 'crate') return false;
    cur = bodyOf(state, s);
  }
  return false;
}

export function liftRiders(state, lift) {
  let n = 0;
  for (const b of state.blobs) if (b.alive && !b.inDoor && supportChainEndsAt(state, b, lift)) n++;
  return n;
}

function plateActive(state, ids) {
  return state.plates.some((p) => ids.includes(p.id) && p.active);
}

function blockedBy(state, lift, rect, allowRiders) {
  for (const b of dynamicBodies(state)) {
    if (!overlap(b, rect)) continue;
    if (allowRiders && supportChainEndsAt(state, b, lift)) continue;
    return true;
  }
  return false;
}

// Move kinematic lifts; riders are carried (up via pushRidersUp, sideways/down via support carry).
export function moveLifts(state) {
  for (const lift of state.lifts) {
    lift.mx = 0;
    lift.my = 0;
    const len = Math.hypot(lift.bx - lift.ax, lift.by - lift.ay);
    lift.riders = liftRiders(state, lift);
    if (len < 1e-6) continue;
    let dir;
    if (lift.mode === 'weight') dir = lift.riders >= lift.need ? 1 : -1;
    else if (lift.mode === 'plate') dir = plateActive(state, lift.link) ? 1 : -1;
    else {
      // Loop lifts linked to plates only run while powered; dwell pauses at each end.
      if (lift.link.length && !plateActive(state, lift.link)) continue;
      if (lift.wait > 0) {
        lift.wait--;
        continue;
      }
      if (lift.t >= 1) lift.dir = -1;
      else if (lift.t <= 0) lift.dir = 1;
      dir = lift.dir;
    }
    const t = Math.max(0, Math.min(1, lift.t + (dir * lift.speed * DT) / len));
    if (t === lift.t) continue;
    const nx = lift.ax + (lift.bx - lift.ax) * t;
    const ny = lift.ay + (lift.by - lift.ay) * t;
    const dx = nx - lift.x;
    const dy = ny - lift.y;
    const target = { x: nx, y: ny, w: lift.w, h: lift.h };

    if (dy < 0) {
      pushRidersUp(state, lift, dy);
      if (blockedBy(state, lift, target, false)) {
        lift.blocked = true;
        continue;
      }
    } else if (blockedBy(state, lift, target, true)) {
      lift.blocked = true;
      continue;
    }
    lift.blocked = false;
    lift.x = nx;
    lift.y = ny;
    lift.t = t;
    if (lift.mode === 'loop' && (t === 0 || t === 1)) lift.wait = lift.dwell;
    lift.mx = dx;
    lift.my = dy;
  }
}
