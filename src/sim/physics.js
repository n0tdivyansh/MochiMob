import { DT, GRAVITY, MAX_FALL, BOUNCE_V, PAD_V, CONVEYOR, PUSH_SPEED, T } from './constants.js';
import { moveX, moveY } from './collide.js';

export function refOf(body) {
  if (body.kind === 'blob') return { kind: 'blob', idx: body.i };
  return { kind: body.kind, idx: body.idx };
}

export function bodyOf(state, ref) {
  if (!ref) return null;
  if (ref.kind === 'blob') return state.blobs[ref.idx];
  if (ref.kind === 'crate') return state.crates[ref.idx];
  if (ref.kind === 'lift') return state.lifts[ref.idx];
  return null;
}

function idxOf(body) {
  return body.kind === 'blob' ? body.i : body.idx;
}

// True when `rider` rested on `body` at the end of last tick.
export function isSupportedBy(rider, body) {
  const s = rider.support;
  if (!s || s.kind !== body.kind || s.idx !== idxOf(body)) return false;
  return Math.abs(rider.y + rider.h - body.y) < 1;
}

export function dynamicBodies(state) {
  const list = [];
  for (const c of state.crates) list.push(c);
  for (const b of state.blobs) if (b.alive && !b.inDoor) list.push(b);
  return list;
}

// Before `body` moves up by dy (< 0), lift everything standing on it (recursively).
export function pushRidersUp(state, body, dy) {
  for (const r of dynamicBodies(state)) {
    if (r === body || !isSupportedBy(r, body)) continue;
    pushRidersUp(state, r, dy);
    const res = moveY(state, r, dy);
    r.my += res.moved;
  }
}

function landOn(state, body, hit, vyBefore) {
  const target = hit.body;
  const i = idxOf(body);
  const x = body.x + body.w / 2;
  const y = body.y + body.h;
  if (body.kind === 'blob' && target && target.kind === 'blob' && target.squish && vyBefore > 60) {
    body.vy = -BOUNCE_V;
    body.bounced = true;
    body.cut = true;
    body.grounded = false;
    body.support = null;
    state.events.push({ type: 'bounce', i, by: target.i, x, y });
    return;
  }
  if (hit.pad) {
    body.vy = -PAD_V;
    body.grounded = false;
    body.support = null;
    if (body.kind === 'blob') {
      body.bounced = true;
      body.cut = true;
    }
    state.events.push({ type: 'pad', kind: body.kind, i, x, y });
    return;
  }
  body.vy = 0;
  if (body.kind === 'blob') {
    body.cut = false;
    body.bounced = false;
  }
  if (vyBefore > 300) state.events.push({ type: 'land', kind: body.kind, i, v: vyBefore, x, y });
}

function carryFor(state, body) {
  const sup = body.support;
  if (!sup) return { x: 0, y: 0 };
  if (sup.kind === 'tile') {
    if (sup.code === T.CONV_R) return { x: CONVEYOR * DT, y: 0 };
    if (sup.code === T.CONV_L) return { x: -CONVEYOR * DT, y: 0 };
    return { x: 0, y: 0 };
  }
  const s = bodyOf(state, sup);
  if (!s || (s.kind === 'blob' && (!s.alive || s.inDoor))) return { x: 0, y: 0 };
  return { x: s.mx, y: Math.max(0, s.my) };
}

function horizontalHit(body, hit) {
  const other = hit.body;
  if (other && other.kind !== 'lift' && other.mx !== 0 && Math.sign(other.mx) === Math.sign(body.vx)) {
    body.vx = Math.sign(body.vx) * Math.min(Math.abs(body.vx), Math.abs(other.mx) / DT);
  } else {
    body.vx = 0;
  }
}

// Move every dynamic body one tick: gravity, carry, vertical then horizontal sweep.
// Bodies are processed bottom-up so supports move before their riders.
export function integrate(state) {
  const bodies = dynamicBodies(state);
  for (const b of bodies) {
    b.mx = 0;
    b.my = 0;
  }
  const moved = new Set();
  bodies.sort((a, b) => b.y + b.h - (a.y + a.h));
  const g = GRAVITY * DT;
  const deferred = [];

  for (const body of bodies) {
    const carry = carryFor(state, body);
    const wasGrounded = body.grounded;
    body.grounded = false;
    body.support = null;

    // Vertical: exact parabola per tick (velocity Verlet).
    const vyBefore = body.vy;
    let dy = (body.vy + g / 2) * DT;
    body.vy = Math.min(body.vy + g, MAX_FALL);
    dy += carry.y;
    if (dy < 0) pushRidersUp(state, body, dy);
    const ry = moveY(state, body, dy);
    body.my += ry.moved;
    if (ry.hit) {
      if (dy > 0) landOn(state, body, ry.hit, wasGrounded ? 0 : vyBefore);
      else if (body.vy < 0) body.vy = 0;
    }

    // Horizontal
    const own = body.kind === 'crate' ? body.pushDir * PUSH_SPEED * DT : body.vx * DT;
    const dx = own + carry.x;
    const rx = moveX(state, body, dx);
    body.mx += rx.moved;
    if (rx.hit) {
      const other = rx.hit.body;
      if (other && other.kind !== 'lift' && !moved.has(other)) {
        deferred.push({ body, rest: dx - rx.moved });
      } else if (body.kind === 'blob') {
        horizontalHit(body, rx.hit);
      }
    }
    moved.add(body);
  }

  for (const { body, rest } of deferred) {
    const rx = moveX(state, body, rest);
    body.mx += rx.moved;
    if (rx.hit && body.kind === 'blob') horizontalHit(body, rx.hit);
  }
}
