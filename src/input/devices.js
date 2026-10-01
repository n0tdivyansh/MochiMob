// Keyboard + gamepad state. Game code reads bits per device; UI code drains
// navigation events ('up','down','left','right','ok','back','pause').
import { bitsFor, DEFAULT_BINDINGS, SOLO_KEYS } from './bindings.js';
import { INPUT } from '../sim/constants.js';

const NAV_KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'ok', Space: 'ok', Escape: 'back', KeyP: 'pause' };
const PAD_NAV = { 12: 'up', 13: 'down', 14: 'left', 15: 'right', 0: 'ok', 1: 'back', 9: 'pause' };
const DEAD = 0.35;

export function createInput(win = window) {
  const down = new Set();
  let pressed = [];
  let nav = [];
  let bindings = DEFAULT_BINDINGS;
  const pads = new Map(); // index -> { bits, buttons: boolean[] }

  const isTyping = (e) => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const gameKeys = () => new Set([...bindings.flatMap((b) => Object.values(b)), SOLO_KEYS.follow, ...SOLO_KEYS.pick, 'Space']);

  win.addEventListener('keydown', (e) => {
    if (isTyping(e)) return;
    if (!e.repeat) {
      pressed.push(e.code);
      if (NAV_KEYS[e.code]) nav.push({ action: NAV_KEYS[e.code], source: 'kb' });
    }
    down.add(e.code);
    if (gameKeys().has(e.code) || NAV_KEYS[e.code]) e.preventDefault();
  });
  win.addEventListener('keyup', (e) => down.delete(e.code));
  win.addEventListener('blur', () => down.clear());

  function pollPads() {
    const list = win.navigator.getGamepads ? win.navigator.getGamepads() : [];
    const seen = new Set();
    for (const gp of list) {
      if (!gp || !gp.connected) continue;
      seen.add(gp.index);
      const btn = (i) => !!gp.buttons[i]?.pressed;
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      let bits = 0;
      if (ax < -DEAD || btn(14)) bits |= INPUT.LEFT;
      if (ax > DEAD || btn(15)) bits |= INPUT.RIGHT;
      if (btn(0)) bits |= INPUT.JUMP | INPUT.UP;
      if (btn(12) || ay < -0.6) bits |= INPUT.UP;
      if (btn(1) || btn(13) || ay > 0.6) bits |= INPUT.SQUISH;
      const prev = pads.get(gp.index)?.buttons ?? [];
      const buttons = gp.buttons.map((b) => b.pressed);
      buttons.forEach((on, i) => {
        if (on && !prev[i]) {
          pressed.push(`Pad${gp.index}:${i}`);
          if (PAD_NAV[i]) nav.push({ action: PAD_NAV[i], source: `pad${gp.index}` });
        }
      });
      // Stick flicks navigate menus too.
      const prevAx = pads.get(gp.index)?.ax ?? 0;
      if (Math.abs(ax) > 0.6 && Math.abs(prevAx) <= 0.6) nav.push({ action: ax < 0 ? 'left' : 'right', source: `pad${gp.index}` });
      const prevAy = pads.get(gp.index)?.ay ?? 0;
      if (Math.abs(ay) > 0.6 && Math.abs(prevAy) <= 0.6) nav.push({ action: ay < 0 ? 'up' : 'down', source: `pad${gp.index}` });
      pads.set(gp.index, { bits, buttons, ax, ay });
    }
    for (const i of pads.keys()) if (!seen.has(i)) pads.delete(i);
  }

  return {
    poll: pollPads,
    setBindings(b) {
      bindings = b;
    },
    get bindings() {
      return bindings;
    },
    kbBits: (slot) => bitsFor(bindings[slot], down),
    padBits: (index) => pads.get(index)?.bits ?? 0,
    padIndices: () => [...pads.keys()],
    isDown: (code) => down.has(code),
    // Codes pressed since the last drain (keyboard codes and 'Pad<i>:<button>').
    drainPressed() {
      const p = pressed;
      pressed = [];
      return p;
    },
    drainNav() {
      const n = nav;
      nav = [];
      return n;
    },
  };
}

// Bits for a device descriptor: { kind: 'kb', slot } or { kind: 'pad', index }.
export function deviceBits(input, dev) {
  return dev.kind === 'kb' ? input.kbBits(dev.slot) : input.padBits(dev.index);
}
