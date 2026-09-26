import { parseLevel } from './level.js';
import { BLOB_W, BLOB_H, TETHER_LEN, TILE } from './constants.js';

function makeBlob(i, sp) {
  return {
    kind: 'blob', i, x: sp.x, y: sp.y, w: BLOB_W, h: BLOB_H, vx: 0, vy: 0,
    color: i, alive: true, deadT: 0, squish: false, grounded: false, support: null,
    coyote: 0, jumpBuf: 0, cut: false, bounced: false, facing: 1, inDoor: false,
    prev: 0, lastSafe: { x: sp.x, y: sp.y }, dir: 0, mx: 0, my: 0, ai: { jumpT: 0 }, landT: 0, airT: 0,
  };
}

// Build a fresh simulation state for `def` played by `n` players (or an n-blob solo team).
export function createWorld(def, n, { solo = false } = {}) {
  if (!(n >= 2 && n <= 4)) throw new Error(`player count must be 2-4, got ${n}`);
  const L = parseLevel(def, n);
  const s = {
    v: 1,
    levelId: def.id,
    n,
    tick: 0,
    solo: solo ? { active: 0, follow: false } : null,
    static: L.static,
    spawns: L.spawns.slice(0, 4),
    blobs: [],
    crates: [],
    plates: [],
    gates: [],
    cgates: [],
    lifts: [],
    paints: [],
    key: { x: L.key.x, y: L.key.y, holder: -1, home: { x: L.key.x, y: L.key.y } },
    door: { ...L.door, open: false },
    checkpoints: L.checkpoints.map((c) => ({ ...c, active: false })),
    respawn: null,
    tether: def.tether ? { len: def.tetherLen ? def.tetherLen * TILE : TETHER_LEN } : null,
    cleared: false,
    events: [],
  };
  for (let i = 0; i < n; i++) s.blobs.push(makeBlob(i, L.spawns[i]));

  for (const e of L.entities) {
    switch (e.type) {
      case 'crate': {
        // Crates sit on the floor of their tile.
        const y = e.y + TILE - e.h;
        s.crates.push({
          kind: 'crate', idx: s.crates.length, id: e.id ?? `crate${s.crates.length}`,
          x: e.x, y, w: e.w, h: e.h, vx: 0, vy: 0,
          weight: e.weight ?? 1, home: { x: e.x, y }, grounded: false, support: null,
          mx: 0, my: 0, pushDir: 0,
        });
        break;
      }
      case 'plate':
        // Plate surface sits on top of the floor under its tile.
        s.plates.push({
          id: e.id, x: e.x, y: e.y + TILE, w: e.w, need: e.need ?? 1, latch: !!e.latch,
          color: typeof e.color === 'number' ? e.color : null, count: 0, active: false, latched: false,
        });
        break;
      case 'gate':
        s.gates.push({
          id: e.id ?? `gate${s.gates.length}`, x: e.x, y: e.y, w: e.w, h: e.h,
          link: e.link ?? [], mode: e.mode ?? 'any', open: 0,
        });
        break;
      case 'cgate':
        s.cgates.push({ x: e.x, y: e.y, w: e.w, h: e.h, color: e.color });
        break;
      case 'lift': {
        const h = e.lh !== undefined ? e.lh * TILE : TILE / 2;
        const ax = e.ax ?? e.x;
        const ay = e.ay ?? e.y;
        s.lifts.push({
          kind: 'lift', idx: s.lifts.length, id: e.id ?? `lift${s.lifts.length}`, x: ax, y: ay, w: e.w, h,
          ax, ay, bx: e.bx ?? ax, by: e.by ?? ay, t: 0, dir: 1, mode: e.mode ?? 'loop',
          need: e.need ?? 1, link: e.link ?? [], speed: e.speed ?? 120, mx: 0, my: 0, riders: 0,
          dwell: e.dwell ?? 0, wait: e.dwell ?? 0,
        });
        break;
      }
      case 'paint':
        s.paints.push({ x: e.x, y: e.y, w: e.w, h: e.h, color: e.color });
        break;
      default:
        throw new Error(`level ${def.id}: unknown entity type '${e.type}'`);
    }
  }
  return s;
}
