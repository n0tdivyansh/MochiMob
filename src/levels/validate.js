import { parseLevel } from '../sim/level.js';
import { createWorld } from '../sim/world.js';
import { overlapsSolid } from '../sim/collide.js';

// Structural checks for a level definition at player count n. Returns error strings.
export function validate(def, n) {
  const errors = [];
  for (const f of ['id', 'name', 'world', 'par', 'gold']) if (def[f] === undefined) errors.push(`missing ${f}`);
  if (def.gold !== undefined && def.par !== undefined && !(def.gold > 0 && def.gold < def.par)) errors.push('need 0 < gold < par');
  let L;
  try {
    L = parseLevel(def, n);
  } catch (e) {
    return [...errors, e.message];
  }
  const { W, H } = L.static;
  const plateIds = new Set(L.entities.filter((e) => e.type === 'plate').map((e) => e.id));
  for (const e of L.entities) {
    if (e.x < 0 || e.y < 0 || e.x + e.w > W || e.y + e.h > H) errors.push(`${e.type} ${e.id ?? ''} out of bounds`);
    if (e.type === 'plate' && !e.id) errors.push('plate without id');
    for (const id of e.link ?? []) if (!plateIds.has(id)) errors.push(`${e.type} ${e.id ?? ''} links missing plate ${id}`);
    if (e.type === 'lift') {
      for (const [x, y] of [[e.ax ?? e.x, e.ay ?? e.y], [e.bx ?? e.x, e.by ?? e.y]]) {
        if (x < 0 || y < 0 || x + e.w > W || y > H) errors.push(`lift ${e.id ?? ''} path out of bounds`);
      }
    }
  }
  try {
    const s = createWorld(def, n);
    for (const b of s.blobs) if (overlapsSolid(s, b)) errors.push(`spawn ${b.i} overlaps a solid`);
    for (const c of s.crates) if (overlapsSolid(s, c)) errors.push(`crate ${c.id} overlaps a solid`);
  } catch (e) {
    errors.push(e.message);
  }
  return errors;
}
