import {
  DT, RUN, ACCEL_GROUND, ACCEL_AIR, FRICTION, JUMP_V, JUMP_CUT, COYOTE, JUMP_BUFFER,
  BLOB_H, SQUISH_H, INPUT,
} from './constants.js';
import { overlapsSolid } from './collide.js';

const AIR_DRAG = 1400;

export function setSquish(state, b, on) {
  if (on === b.squish) return true;
  if (on) {
    b.y += b.h - SQUISH_H;
    b.h = SQUISH_H;
    b.squish = true;
    b.vx = 0;
    state.events.push({ type: 'squish', i: b.i });
    return true;
  }
  const oldY = b.y;
  b.y = oldY - (BLOB_H - SQUISH_H);
  b.h = BLOB_H;
  if (overlapsSolid(state, b)) {
    b.y = oldY;
    b.h = SQUISH_H;
    return false;
  }
  b.squish = false;
  state.events.push({ type: 'unsquish', i: b.i });
  return true;
}

function approach(v, target, amount) {
  if (v < target) return Math.min(v + amount, target);
  return Math.max(v - amount, target);
}

// Apply one tick of player intent to a living blob (velocity only; movement happens in integrate).
export function controlBlob(state, b, bits, pressed) {
  let dir = (bits & INPUT.RIGHT ? 1 : 0) - (bits & INPUT.LEFT ? 1 : 0);

  if (b.squish) {
    if (!(bits & INPUT.SQUISH)) setSquish(state, b, false);
  } else if (bits & INPUT.SQUISH && b.grounded) {
    setSquish(state, b, true);
  }
  if (b.squish) dir = 0;

  if (dir !== 0) {
    b.facing = dir;
    const accel = b.grounded ? ACCEL_GROUND : ACCEL_AIR;
    const turning = Math.sign(b.vx) === -dir;
    b.vx = approach(b.vx, dir * RUN, (turning && b.grounded ? accel + FRICTION : accel) * DT);
  } else {
    b.vx = approach(b.vx, 0, (b.grounded ? FRICTION : AIR_DRAG) * DT);
  }

  if (pressed & INPUT.JUMP) b.jumpBuf = JUMP_BUFFER;
  else if (b.jumpBuf > 0) b.jumpBuf--;
  if (b.grounded) b.coyote = COYOTE;
  else if (b.coyote > 0) b.coyote--;

  if (b.jumpBuf > 0 && b.coyote > 0 && !b.squish) {
    b.vy = -JUMP_V;
    b.jumpBuf = 0;
    b.coyote = 0;
    b.grounded = false;
    b.support = null;
    b.cut = false;
    b.bounced = false;
    state.events.push({ type: 'jump', i: b.i });
  }

  // Variable jump height: releasing jump while rising cuts upward speed once.
  if (!(bits & INPUT.JUMP) && b.vy < 0 && !b.cut && !b.bounced) {
    b.vy *= JUMP_CUT;
    b.cut = true;
  }
}
