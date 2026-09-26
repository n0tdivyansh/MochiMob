import { TILE, BLOB_W, BLOB_H, T } from './constants.js';

const CHAR_TILE = {
  '#': T.SOLID,
  '=': T.ONEWAY,
  '^': T.SPIKES,
  '>': T.CONV_R,
  '<': T.CONV_L,
  v: T.LOW,
  B: T.PAD,
};

const SCALED_FIELDS = ['need', 'weight'];

function resolveCount(value, n) {
  if (value === 'all' || value === 'players') return n;
  if (value === 'all-1') return Math.max(1, n - 1);
  if (typeof value === 'number') return Math.max(1, Math.round(value));
  return value;
}

function mapColor(def, n, slot) {
  const m = def.colorMap && def.colorMap[n];
  if (m && m[slot] !== undefined) return m[slot];
  return slot;
}

// Parse a level definition for n players into static geometry + resolved entities.
export function parseLevel(def, n) {
  const map = def.map;
  if (!Array.isArray(map) || map.length === 0) throw new Error(`level ${def.id}: empty map`);
  const cols = map[0].length;
  const rows = map.length;
  const tiles = new Array(cols * rows).fill(T.EMPTY);
  const spawns = [];
  let key = null;
  let door = null;
  const checkpoints = [];

  for (let r = 0; r < rows; r++) {
    const line = map[r];
    if (line.length !== cols) throw new Error(`level ${def.id}: row ${r} has length ${line.length}, expected ${cols}`);
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      const x = c * TILE;
      const y = r * TILE;
      if (CHAR_TILE[ch] !== undefined) tiles[r * cols + c] = CHAR_TILE[ch];
      else if (ch === 'S') spawns.push({ x: x + (TILE - BLOB_W) / 2, y: y + TILE - BLOB_H });
      else if (ch === 'K') {
        if (key) throw new Error(`level ${def.id}: more than one key`);
        key = { x: x + TILE / 2, y: y + TILE / 2 };
      } else if (ch === 'D') {
        if (door) throw new Error(`level ${def.id}: more than one door`);
        door = { x, y: y + TILE - 96, w: TILE, h: 96 };
      } else if (ch === 'C') checkpoints.push({ x: x + TILE / 2, y: y + TILE });
      else if (ch !== '.' && ch !== ' ') throw new Error(`level ${def.id}: unknown char '${ch}' at ${c},${r}`);
    }
  }
  if (spawns.length < 4) throw new Error(`level ${def.id}: needs 4 spawn points, found ${spawns.length}`);
  if (!key) throw new Error(`level ${def.id}: missing key`);
  if (!door) throw new Error(`level ${def.id}: missing door`);

  const entities = [];
  for (const src of def.entities || []) {
    if (src.minPlayers && n < src.minPlayers) continue;
    if (src.maxPlayers && n > src.maxPlayers) continue;
    const e = { ...src };
    e.x = (src.x ?? 0) * TILE;
    e.y = (src.y ?? 0) * TILE;
    e.w = (src.w ?? 1) * TILE;
    e.h = (src.h ?? 1) * TILE;
    for (const f of SCALED_FIELDS) if (f in e) e[f] = resolveCount(e[f], n);
    if (typeof e.color === 'number') e.color = mapColor(def, n, e.color);
    for (const f of ['ax', 'ay', 'bx', 'by']) if (typeof src[f] === 'number') e[f] = src[f] * TILE;
    entities.push(e);
  }

  return {
    static: { cols, rows, W: cols * TILE, H: rows * TILE, tiles },
    spawns,
    key,
    door,
    checkpoints,
    entities,
  };
}
