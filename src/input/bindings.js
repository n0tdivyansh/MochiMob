import { INPUT } from '../sim/constants.js';

export const ACTIONS = ['left', 'right', 'jump', 'squish', 'emote1', 'emote2'];
export const ACTION_LABELS = { left: 'Left', right: 'Right', jump: 'Jump / Enter', squish: 'Squish', emote1: 'Emote 1', emote2: 'Emote 2' };

export const DEFAULT_BINDINGS = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', squish: 'KeyS', emote1: 'KeyQ', emote2: 'KeyE' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', squish: 'ArrowDown', emote1: 'Comma', emote2: 'Period' },
  { left: 'KeyJ', right: 'KeyL', jump: 'KeyI', squish: 'KeyK', emote1: 'KeyU', emote2: 'KeyO' },
  { left: 'Numpad4', right: 'Numpad6', jump: 'Numpad8', squish: 'Numpad5', emote1: 'Numpad7', emote2: 'Numpad9' },
];

// Solo extras (slot 0 and slot 1 keys both drive the active blob).
export const SOLO_KEYS = { prev: 'KeyQ', next: 'KeyE', follow: 'KeyF', pick: ['Digit1', 'Digit2', 'Digit3', 'Digit4'] };

// Jump doubles as "up" so the same key enters doors.
export function bitsFor(b, down) {
  let bits = 0;
  if (down.has(b.left)) bits |= INPUT.LEFT;
  if (down.has(b.right)) bits |= INPUT.RIGHT;
  if (down.has(b.jump)) bits |= INPUT.JUMP | INPUT.UP;
  if (down.has(b.squish)) bits |= INPUT.SQUISH;
  return bits;
}

// Returns new bindings with slot/action bound to code. A code already used
// anywhere else is swapped so no key ever drives two actions.
export function rebind(bindings, slot, action, code) {
  const next = bindings.map((b) => ({ ...b }));
  const old = next[slot][action];
  for (const b of next) for (const a of ACTIONS) if (b[a] === code) b[a] = old;
  next[slot][action] = code;
  return next;
}

// Human-readable key name for UI hints.
export function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num${code.slice(6)}`;
  const map = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Comma: ',', Period: '.', Space: 'Space', Escape: 'Esc' };
  return map[code] ?? code;
}
