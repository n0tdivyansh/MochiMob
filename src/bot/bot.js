// Closed-loop script runner. Drives the simulation with high-level steps so
// tests (and the title-screen attract mode) can play levels deterministically.
import { step } from '../sim/step.js';
import { solidsFor } from '../sim/collide.js';
import { overlap, hOverlapLen } from '../sim/geom.js';
import { soloCommand } from '../sim/solo.js';
import { INPUT, TILE, FRICTION, ACCEL_AIR } from '../sim/constants.js';

const { LEFT, RIGHT, JUMP, UP, SQUISH } = INPUT;
const DEFAULT_TIMEOUT = 1200;

const cx = (b) => b.x + b.w / 2;
const tileX = (t) => t * TILE + TILE / 2;
const dirBits = (d) => (d > 0 ? RIGHT : d < 0 ? LEFT : 0);

function describe(st) {
  if (st.label) return `${st.do} ${st.label}`;
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
              jumpT = st.hold ?? 22;
            }
          }
          let bits = 0;
          if (jumpT > 0) {
            jumpT--;
            bits |= JUMP;
          }
          // On the ground friction stops us; in the air we must counter-steer.
          const decel = b.grounded ? FRICTION : ACCEL_AIR;
          const brake = (b.vx * b.vx) / (2 * decel);
          const towards = Math.sign(b.vx) === Math.sign(dx);
          if (Math.abs(dx) > tol + brake) bits |= dirBits(dx);
          else if (!towards && Math.abs(dx) > tol) bits |= dirBits(dx);
          else if (!b.grounded && towards && Math.abs(b.vx) > 40) bits |= dirBits(-dx);
          if (st.hop && jumpT === 0 && b.grounded && !(b.prev & JUMP) && Math.abs(dx) > TILE / 2) {
            const d = Math.sign(dx);
            const front = { x: d > 0 ? b.x + b.w : b.x - 3, y: b.y + 4, w: 3, h: b.h - 8 };
            if (solidsFor(ctx.state, b, front).some((r) => !r.oneWay)) {
              jumpT = 21;
              bits |= JUMP;
            }
          }
          ctx.press(st.p, bits);
          const settled = Math.abs(dx) <= tol + 1 && Math.abs(b.vx) < 40 && b.grounded;
          return settled && (st.do === 'walk' || jumped) && jumpT === 0;
        }),
      };
    }
    case 'jump': {
      let t = 0;
      const hold = st.hold ?? 22;
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
      let hopT = 0;
      return {
        ...base,
        tick: aging((ctx) => {
          if (ctx.state.blobs[st.p].inDoor) return true;
          const b = ctx.blob(st.p);
          if (!b.alive) return false;
          const d = ctx.state.door;
          // Until the key-holder unlocks it, everyone else waits a step short of
          // the door so they never pile up in the doorway.
          const waiting = !d.open && ctx.state.key.holder !== st.p;
          const side = cx(b) < d.x + d.w / 2 ? -1 : 1;
          const dx = d.x + d.w / 2 + (waiting ? side * 110 : 0) - cx(b);
          // Same rule the sim uses: at least half the blob over the doorway.
          const atDoor = !waiting && b.grounded && overlap(b, d) && hOverlapLen(b, d) >= b.w / 2;
          if (waiting && Math.abs(dx) < 40) {
            ctx.press(st.p, 0);
            return false;
          }
          if (!atDoor) {
            const brake = (b.vx * b.vx) / (2 * FRICTION);
            let bits = Math.abs(dx) > 6 + brake ? dirBits(dx) : 0;
            if (hopT > 0) {
              hopT--;
              bits |= JUMP;
            } else if (bits && b.grounded && !(b.prev & JUMP)) {
              const d = Math.sign(dx);
              const front = { x: d > 0 ? b.x + b.w : b.x - 3, y: b.y + 4, w: 3, h: b.h - 8 };
              const blockers = solidsFor(ctx.state, b, front).filter((r) => !r.oneWay);
              // Waiting blobs queue behind teammates; everyone hops walls and steps,
              // and the key-holder also hops teammates to reach the door.
              if (waiting && blockers.some((r) => r.body)) bits = 0;
              else if (blockers.length) {
                hopT = 21;
                bits |= JUMP;
              }
            }
            ctx.press(st.p, bits);
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
    case 'seq':
    case 'dyn': {
      // seq: run child steps one after another. dyn: build the child steps from
      // the live state the first time this step runs.
      let kids = null;
      let cur = null;
      const self = {
        ...base,
        label: st.label ? `${st.do} ${st.label}` : st.do,
        timedOut: () => !!cur && cur.timedOut(),
        tick: (ctx) => {
          if (!kids) kids = (st.do === 'dyn' ? st.make(ctx.state) : st.steps).slice();
          for (let guard = 0; guard < 50; guard++) {
            if (!cur) {
              if (kids.length === 0) return true;
              cur = makeAction(kids.shift());
              self.label = `${st.do} > ${cur.label}`;
            }
            if (!cur.tick(ctx)) return false;
            cur = null;
          }
          return false;
        },
      };
      return self;
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
