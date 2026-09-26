import { parseLevel } from './level.js';

const SKIP = new Set(['static', 'events']);

function pack(v) {
  if (typeof v === 'number') return Math.round(v * 100) / 100;
  if (Array.isArray(v)) return v.map(pack);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = pack(v[k]);
    return out;
  }
  return v;
}

// Compact, JSON-safe copy of a state without static geometry or per-tick events.
export function encode(state) {
  const out = {};
  for (const k of Object.keys(state)) if (!SKIP.has(k)) out[k] = pack(state[k]);
  return out;
}

export function decode(snap, staticPart) {
  return { ...structuredClone(snap), static: staticPart, events: [] };
}

export function staticFor(def, n) {
  return parseLevel(def, n).static;
}
