// Closed-loop script runner. Drives the simulation with high-level steps so
// tests (and the title-screen attract mode) can play levels deterministically.
import { step } from '../sim/step.js';
import { solidsFor } from '../sim/collide.js';
import { soloCommand } from '../sim/solo.js';
import { INPUT, TILE, FRICTION } from '../sim/constants.js';

const { LEFT, RIGHT, JUMP, UP, SQUISH } = INPUT;
const DEFAULT_TIMEOUT = 1200;

const cx = (b) => b.x + b.w / 2;
const tileX = (t) => t * TILE + TILE / 2;
const dirBits = (d) => (d > 0 ? RIGHT : d < 0 ? LEFT : 0);

function describe(st) {
  return `${st.do}${st.p !== undefined ? ` p${st.p}` : ''}${st.to !== undefined ? ` to ${st.to}` : ''}`;
}

// Build an action object for a script step. Each action exposes tick(ctx) -> bool (done).
function makeAction(st) {
  const timeout = st.timeout ?? DEFAULT_TIMEOUT;
  let age = 0;
  const base = { st, timedOut: () => age > timeout, label: describe(st) };
  const aging = (fn) => (ctx) => {
    age++;
    return fn(ctx);
  };

  switch (st.do) {
    case 'walk':
    case 'walkJump': {
      let jumped = false;
      let jumpT = 0;
      const tol = st.tol ?? 4;
      return {
        ...base,
        tick: aging((ctx) => {
          const b = ctx.blob(st.p);
          if (!b.alive) return false;
          const target = st.px ?? tileX(st.to);
          const dx = target - cx(b);
          if (st.do === 'walkJump' && !jumped && b.grounded && !(b.prev & JUMP)) {
            const at = tileX(st.at) - TILE / 2;
            const crossing = dx > 0 ? cx(b) >= at : cx(b) <= at;
            if (crossing) {
              jumped = true;
              jumpT = st.hold ?? 16;
            }
          }
          let bits = 0;
          if (jumpT > 0) {
            jumpT--;
            bits |= JUMP;
          }
          const brake = (b.vx * b.vx) / (2 * FRICTION);
          if (Math.abs(dx) > tol + brake) bits |= dirBits(dx);
          if (st.hop && jumpT === 0 && b.grounded && !(b.prev & JUMP) && Math.abs(dx) > TILE / 2) {
            const d = Math.sign(dx);
            const front = { x: d > 0 ? b.x + b.w : b.x - 3, y: b.y + 4, w: 3, h: b.h - 8 };
            if (solidsFor(ctx.state, b, front).some((r) => !r.oneWay)) {
              jumpT = 16;
              bits |= JUMP;
            }
          }
          else if (Math.sign(b.vx) === -Math.sign(dx) && Math.abs(dx) > tol) bits |= dirBits(dx);
          ctx.press(st.p, bits);
          const settled = Math.abs(dx) <= tol + 1 && Math.abs(b.vx) < 40 && b.grounded;
          return settled && (st.do === 'walk' || jumped) && jumpT === 0;
        }),
      };
    }
    case 'jump': {
      let t = 0;
      const hold = st.hold ?? 16;
      return {
        ...base,
        tick: aging((ctx) => {
          const b = ctx.blob(st.p);
          if (t === 0 && b.prev & JUMP) {
            ctx.press(st.p, dirBits(st.dir ?? 0));
            return false;
          }
          t++;
          let bits = dirBits(st.dir ?? 0);
          if (t <= hold) bits |= JUMP;
          ctx.press(st.p, bits);
          return t > hold && b.grounded;
        }),
      };
    }
    case 'squish':
      return {
        ...base,
        tick: aging((ctx) => {
          ctx.setHold(st.p, SQUISH, st.on !== false);
          return ctx.blob(st.p).squish === (st.on !== false);
        }),
      };
    case 'hold': {
      let t = 0;
      return {
        ...base,
        tick: aging((ctx) => {
          ctx.press(st.p, st.bits);
          return ++t >= st.ticks;
        }),
      };
    }
    case 'wait': {
      let t = 0;
      return { ...base, tick: aging(() => ++t >= st.ticks) };
    }
    case 'until':
      return { ...base, tick: aging((ctx) => !!st.test(ctx.state)) };
    case 'enter': {
      let pressedAt = -10;
      return {
        ...base,
        tick: aging((ctx) => {
          if (ctx.state.blobs[st.p].inDoor) return true;
          const b = ctx.blob(st.p);
          if (!b.alive) return false;
          const d = ctx.state.door;
          const dx = d.x + d.w / 2 - cx(b);
          if (Math.abs(dx) > 10 || !b.grounded) {
            const brake = (b.vx * b.vx) / (2 * FRICTION);
            ctx.press(st.p, Math.abs(dx) > 6 + brake ? dirBits(dx) : 0);
            return false;
          }
          if (ctx.state.door.open && ctx.tick - pressedAt > 2 && !(b.prev & UP)) {
            ctx.press(st.p, UP);
            pressedAt = ctx.tick;
          }
          return false;
        }),
      };
    }
    case 'swap':
      return {
        ...base,
        tick: aging((ctx) => {
          if (!ctx.state.solo) throw new Error('swap is solo-only');
          soloCommand(ctx.state, st.to);
          return ctx.state.solo.active === st.to;
        }),
      };
    case 'follow':
      return {
        ...base,
        tick: aging((ctx) => {
          if (!ctx.state.solo) throw new Error('follow is solo-only');
          if (ctx.state.solo.follow !== st.on) soloCommand(ctx.state, 'follow');
          return true;
        }),
      };
    case 'par': {
      const kids = st.steps.map(makeAction);
      const done = kids.map(() => false);
      return {
        ...base,
        label: `par[${kids.map((k) => k.label).join(', ')}]`,
        timedOut: () => kids.some((k, i) => !done[i] && k.timedOut()),
        tick: (ctx) => {
          kids.forEach((k, i) => {
            if (!done[i]) done[i] = k.tick(ctx);
          });
          return done.every(Boolean);
        },
      };
    }
    case 'call':
      return { ...base, tick: aging((ctx) => st.fn(ctx.state) !== false) };
    default:
      throw new Error(`unknown bot step '${st.do}'`);
  }
}

export function runScript(state, script, { maxTicks = 20000, onTick } = {}) {
  const solo = !!state.solo;
  const hold = new Array(state.n).fill(0);
  let queue = script.map((s) => s);
  let action = null;
  let pressBits = new Array(state.n).fill(0);

  const ctx = {
    state,
    get tick() {
      return state.tick;
    },
    blob(p) {
      if (solo && p !== state.solo.active) throw new Error(`solo step for blob ${p} but active is ${state.solo.active}`);
      return state.blobs[p];
    },
    press(p, bits) {
      pressBits[p] |= bits;
    },
    setHold(p, bits, on) {
      hold[p] = on ? hold[p] | bits : hold[p] & ~bits;
    },
  };

  let idleAfter = 0;
  while (state.tick < maxTicks) {
    if (state.cleared) return { cleared: true, ticks: state.tick };
    pressBits = new Array(state.n).fill(0);
    try {
      // Advance through instantly-finishing steps within the same tick.
      let guard = 0;
      while (guard++ < 50) {
        if (!action) {
          if (queue.length === 0) break;
          action = makeAction(queue.shift());
        }
        if (action.tick(ctx)) {
          action = null;
          continue;
        }
        if (action.timedOut()) return { cleared: false, ticks: state.tick, reason: `timeout in ${action.label}` };
        break;
      }
    } catch (err) {
      return { cleared: false, ticks: state.tick, reason: err.message };
    }
    if (!action && queue.length === 0 && ++idleAfter > 180) break;

    if (solo) {
      const a = state.solo.active;
      step(state, (hold[a] | pressBits[a]) & 31);
    } else {
      step(state, hold.map((h, i) => (h | pressBits[i]) & 31));
    }
    if (onTick) onTick(state);
  }
  if (state.cleared) return { cleared: true, ticks: state.tick };
  return { cleared: false, ticks: state.tick, reason: action ? `stuck in ${action.label}` : 'script ended without clear' };
}
