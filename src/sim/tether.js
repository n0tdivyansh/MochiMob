import { moveX, moveY } from './collide.js';

const ITERATIONS = 3;

function centerOf(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

// Move a blob by (dx, dy) through collision. When the horizontal pull is blocked
// by a wall while hanging, convert it into climbing so ropes can haul over lips.
function pull(state, b, dx, dy) {
  const ry = moveY(state, b, dy);
  b.my += ry.moved;
  const rx = moveX(state, b, dx);
  b.mx += rx.moved;
  const blocked = Math.abs(dx - rx.moved);
  if (blocked > 0.01 && !b.grounded && rx.hit && rx.hit.ref.kind === 'tile') {
    const up = moveY(state, b, -blocked);
    b.my += up.moved;
    const again = moveX(state, b, dx - rx.moved);
    b.mx += again.moved;
  }
}

// Rope constraint between consecutive living blobs (i, i+1).
export function applyTether(state) {
  if (!state.tether) return;
  const len = state.tether.len;
  const live = state.blobs.filter((b) => b.alive && !b.inDoor);
  for (let it = 0; it < ITERATIONS; it++) {
    for (let k = 0; k + 1 < live.length; k++) {
      const a = live[k];
      const b = live[k + 1];
      const ca = centerOf(a);
      const cb = centerOf(b);
      const dx = cb.x - ca.x;
      const dy = cb.y - ca.y;
      const d = Math.hypot(dx, dy);
      if (d <= len || d < 1e-6) continue;
      const nx = dx / d;
      const ny = dy / d;
      const excess = d - len;
      let wa = 0.5;
      let wb = 0.5;
      if (a.grounded && !b.grounded) {
        wa = 0;
        wb = 1;
      } else if (b.grounded && !a.grounded) {
        wa = 1;
        wb = 0;
      }
      if (wa > 0) pull(state, a, nx * excess * wa, ny * excess * wa);
      if (wb > 0) pull(state, b, -nx * excess * wb, -ny * excess * wb);
      // Remove the separating part of the relative velocity.
      const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rv > 0) {
        a.vx += nx * rv * wa;
        a.vy += ny * rv * wa;
        b.vx -= nx * rv * wb;
        b.vy -= ny * rv * wb;
      }
    }
  }
}
