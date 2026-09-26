import { DT, GATE_SPEED, TILE } from './constants.js';
import { overlap, hOverlapLen } from './geom.js';
import { gateRect, nudgeFree } from './collide.js';
import { dynamicBodies } from './physics.js';

// A body presses a plate when it rests on the floor the plate lies on.
function pressing(body, plate) {
  if (!body.grounded) return false;
  if (Math.abs(body.y + body.h - plate.y) > 2) return false;
  return hOverlapLen(body, plate) >= 8;
}

// True when body rests (directly or through a stack) on something in `base`.
function stackedOn(state, body, base) {
  let cur = body;
  for (let depth = 0; depth < 8 && cur && cur.support; depth++) {
    const s = cur.support;
    if (s.kind !== 'blob' && s.kind !== 'crate') return false;
    cur = s.kind === 'blob' ? state.blobs[s.idx] : state.crates[s.idx];
    if (base.has(cur)) return true;
  }
  return false;
}

export function updatePlates(state) {
  for (const p of state.plates) {
    const counts = (b) => b.alive && !b.inDoor && (p.color === null || b.color === p.color);
    const direct = new Set();
    for (const b of state.blobs) if (counts(b) && pressing(b, p)) direct.add(b);
    if (p.color === null) for (const c of state.crates) if (pressing(c, p)) direct.add(c);
    let count = direct.size;
    // Blobs stacked on pressers add their weight too.
    for (const b of state.blobs) if (!direct.has(b) && counts(b) && stackedOn(state, b, direct)) count++;
    p.count = count;
    const on = count >= p.need;
    if (on && p.latch) p.latched = true;
    const active = on || p.latched;
    if (active !== p.active) {
      p.active = active;
      state.events.push({ type: active ? 'plateOn' : 'plateOff', id: p.id, x: p.x + p.w / 2, y: p.y });
    }
  }
}

function linkActive(state, g) {
  const linked = state.plates.filter((p) => g.link.includes(p.id));
  if (linked.length === 0) return false;
  return g.mode === 'all' ? linked.every((p) => p.active) : linked.some((p) => p.active);
}

export function updateGates(state) {
  const bodies = dynamicBodies(state);
  for (const g of state.gates) {
    const want = linkActive(state, g);
    if (want !== !!g.want) {
      g.want = want;
      state.events.push({ type: want ? 'gateOpen' : 'gateClose', id: g.id, x: g.x + g.w / 2, y: g.y + g.h / 2 });
    }
    if (want) {
      g.open = Math.min(1, g.open + GATE_SPEED * DT);
    } else if (g.open > 0) {
      const next = Math.max(0, g.open - GATE_SPEED * DT);
      const rect = gateRect({ ...g, open: next });
      // Never close onto a body: hold position until the path is clear.
      if (!rect || !bodies.some((b) => overlap(rect, b))) g.open = next;
    }
  }
}

export function updatePaint(state) {
  for (const p of state.paints) {
    for (const b of state.blobs) {
      if (!b.alive || b.inDoor || b.color === p.color) continue;
      if (overlap(b, p) && hOverlapLen(b, p) >= b.w / 2) {
        b.color = p.color;
        state.events.push({ type: 'paint', i: b.i, color: p.color, x: b.x + b.w / 2, y: b.y + b.h });
      }
    }
  }
}

export function recoverCrates(state) {
  const limit = state.static.H + TILE;
  for (const c of state.crates) {
    if (c.y <= limit) continue;
    c.x = c.home.x;
    c.y = c.home.y;
    c.vx = 0;
    c.vy = 0;
    c.pushDir = 0;
    c.support = null;
    c.grounded = false;
    nudgeFree(state, c);
    state.events.push({ type: 'crateReset', idx: c.idx, x: c.x + c.w / 2, y: c.y + c.h / 2 });
  }
}
