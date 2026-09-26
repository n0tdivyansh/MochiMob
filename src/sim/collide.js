import { TILE, T, ONEWAY_H, LOW_H, PAD_H } from './constants.js';
import { overlap } from './geom.js';
import { spanLimits } from './camera.js';

const SUBSTEP = 8;

function tileRect(code, c, r) {
  const x = c * TILE;
  const y = r * TILE;
  switch (code) {
    case T.SOLID:
    case T.CONV_R:
    case T.CONV_L:
      return { x, y, w: TILE, h: TILE, ref: { kind: 'tile', code } };
    case T.ONEWAY:
      return { x, y, w: TILE, h: ONEWAY_H, oneWay: true, ref: { kind: 'tile', code } };
    case T.LOW:
      return { x, y, w: TILE, h: LOW_H, ref: { kind: 'tile', code } };
    case T.PAD:
      return { x, y: y + TILE - PAD_H, w: TILE, h: PAD_H, pad: true, ref: { kind: 'tile', code } };
    default:
      return null;
  }
}

// Tile code at column c, row r. Columns outside the map are solid walls;
// rows above are open sky and rows below are the pit.
export function tileAt(state, c, r) {
  const st = state.static;
  if (c < 0 || c >= st.cols) return T.SOLID;
  if (r < 0 || r >= st.rows) return T.EMPTY;
  return st.tiles[r * st.cols + c];
}

export function tileSolids(state, area, out = []) {
  const c0 = Math.floor(area.x / TILE);
  const c1 = Math.floor((area.x + area.w - 1e-6) / TILE);
  const r0 = Math.floor(area.y / TILE);
  const r1 = Math.floor((area.y + area.h - 1e-6) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const rect = tileRect(tileAt(state, c, r), c, r);
      if (rect) out.push(rect);
    }
  }
  return out;
}

// The still-closed part of a sliding gate (slides up into its top edge).
export function gateRect(g) {
  const h = g.h * (1 - g.open);
  return h > 0.5 ? { x: g.x, y: g.y, w: g.w, h } : null;
}

// All rects that can block `body` inside `area`.
// opts.dynamic=false skips crates and blobs (used for static-only checks).
export function solidsFor(state, body, area = body, opts = {}) {
  const dynamic = opts.dynamic !== false;
  const out = tileSolids(state, area);
  for (let i = 0; i < state.gates.length; i++) {
    const r = gateRect(state.gates[i]);
    if (r && overlap(r, area)) out.push({ ...r, ref: { kind: 'gate', idx: i } });
  }
  for (let i = 0; i < state.cgates.length; i++) {
    const g = state.cgates[i];
    if (body.kind === 'blob' && body.color === g.color) continue;
    if (overlap(g, area)) out.push({ x: g.x, y: g.y, w: g.w, h: g.h, ref: { kind: 'cgate', idx: i } });
  }
  for (let i = 0; i < state.lifts.length; i++) {
    const l = state.lifts[i];
    if (l !== body && overlap(l, area)) out.push({ x: l.x, y: l.y, w: l.w, h: l.h, ref: { kind: 'lift', idx: i }, body: l });
  }
  if (dynamic) {
    for (let i = 0; i < state.crates.length; i++) {
      const c = state.crates[i];
      if (c !== body && overlap(c, area)) out.push({ x: c.x, y: c.y, w: c.w, h: c.h, ref: { kind: 'crate', idx: i }, body: c });
    }
    for (let i = 0; i < state.blobs.length; i++) {
      const b = state.blobs[i];
      if (b === body || !b.alive || b.inDoor) continue;
      if (overlap(b, area)) out.push({ x: b.x, y: b.y, w: b.w, h: b.h, ref: { kind: 'blob', idx: i }, body: b });
    }
  }
  if (opts.exclude) return out.filter((s) => !opts.exclude(s));
  return out;
}

function sweepArea(body, dx, dy) {
  return {
    x: Math.min(body.x, body.x + dx) - 1,
    y: Math.min(body.y, body.y + dy) - 1,
    w: body.w + Math.abs(dx) + 2,
    h: body.h + Math.abs(dy) + 2,
  };
}

// Move horizontally by dx, stopping flush against the first solid.
// Solids already overlapping the body are ignored (nudgeFree resolves those).
export function moveX(state, body, dx, opts = {}) {
  const startX = body.x;
  if (!dx) return { moved: 0, hit: null };
  if (body.kind === 'blob') {
    const lim = spanLimits(state, body);
    if (lim) {
      if (dx > 0) dx = Math.min(dx, Math.max(0, lim.max - body.x));
      else dx = Math.max(dx, Math.min(0, lim.min - body.x));
      if (!dx) return { moved: 0, hit: { ref: { kind: 'span' } } };
    }
  }
  const solids = solidsFor(state, body, sweepArea(body, dx, 0), opts).filter((s) => !s.oneWay && !overlap(s, body));
  const steps = Math.ceil(Math.abs(dx) / SUBSTEP);
  const inc = dx / steps;
  for (let k = 0; k < steps; k++) {
    body.x = startX + inc * (k + 1);
    let hit = null;
    for (const s of solids) {
      if (!overlap(s, body)) continue;
      if (inc > 0 ? !hit || s.x < hit.x : !hit || s.x + s.w > hit.x + hit.w) hit = s;
    }
    if (hit) {
      body.x = inc > 0 ? hit.x - body.w : hit.x + hit.w;
      return { moved: body.x - startX, hit };
    }
  }
  body.x = startX + dx;
  return { moved: dx, hit: null };
}

// Move vertically by dy. Landing (dy > 0 and hit) sets grounded + support.
export function moveY(state, body, dy, opts = {}) {
  const startY = body.y;
  if (!dy) return { moved: 0, hit: null };
  const solids = solidsFor(state, body, sweepArea(body, 0, dy), opts).filter((s) => !overlap(s, body));
  const steps = Math.ceil(Math.abs(dy) / SUBSTEP);
  const inc = dy / steps;
  for (let k = 0; k < steps; k++) {
    const prevBottom = body.y + body.h;
    body.y = startY + inc * (k + 1);
    let hit = null;
    for (const s of solids) {
      if (s.oneWay && (inc < 0 || prevBottom > s.y + 0.01)) continue;
      if (!overlap(s, body)) continue;
      if (inc > 0 ? !hit || s.y < hit.y : !hit || s.y + s.h > hit.y + hit.h) hit = s;
    }
    if (hit) {
      body.y = inc > 0 ? hit.y - body.h : hit.y + hit.h;
      if (inc > 0) {
        body.grounded = true;
        body.support = hit.ref;
      }
      return { moved: body.y - startY, hit };
    }
  }
  body.y = startY + dy;
  return { moved: dy, hit: null };
}

export function overlapsSolid(state, body, opts = {}) {
  return solidsFor(state, body, body, opts).some((s) => !s.oneWay && overlap(s, body));
}

// Push a body out of solids by up to 16 px (up first, then sideways, then down).
export function nudgeFree(state, body, opts = {}) {
  if (!overlapsSolid(state, body, opts)) return true;
  const ox = body.x;
  const oy = body.y;
  const offsets = [];
  for (let d = 1; d <= 16; d++) offsets.push([0, -d], [-d, 0], [d, 0]);
  for (let d = 1; d <= 16; d++) offsets.push([0, d]);
  for (const [dx, dy] of offsets) {
    body.x = ox + dx;
    body.y = oy + dy;
    if (!overlapsSolid(state, body, opts)) return true;
  }
  body.x = ox;
  body.y = oy;
  return false;
}
