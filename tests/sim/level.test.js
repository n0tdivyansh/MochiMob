import { describe, it, expect } from 'vitest';
import { parseLevel } from '../../src/sim/level.js';

const def = {
  id: 't',
  map: [
    '##########',
    '#SSSS...K#',
    '#=><.v^BD#',
    '##########',
  ],
  entities: [
    { type: 'plate', id: 'p', x: 2, y: 2, need: 'all' },
    { type: 'crate', x: 4, y: 1, weight: 'all-1' },
    { type: 'gate', x: 6, y: 1, link: ['p'], minPlayers: 3 },
  ],
};

describe('parseLevel', () => {
  it('reads size, spawns, key, door', () => {
    const L = parseLevel(def, 2);
    expect(L.static.cols).toBe(10);
    expect(L.static.W).toBe(640);
    expect(L.static.H).toBe(256);
    expect(L.spawns.length).toBe(4);
    expect(L.spawns[0]).toEqual({ x: 64 + 6, y: 64 + 16 });
    expect(L.key).toEqual({ x: 8 * 64 + 32, y: 64 + 32 });
    expect(L.door).toEqual({ x: 8 * 64, y: 3 * 64 - 96, w: 64, h: 96 });
  });

  it('maps tile codes', () => {
    const t = parseLevel(def, 2).static.tiles;
    const c = 10;
    expect(t[0]).toBe(1);
    expect(t[2 * c + 1]).toBe(2);
    expect(t[2 * c + 2]).toBe(4);
    expect(t[2 * c + 3]).toBe(5);
    expect(t[2 * c + 5]).toBe(6);
    expect(t[2 * c + 6]).toBe(3);
    expect(t[2 * c + 7]).toBe(7);
    expect(t[1 * c + 1]).toBe(0);
  });

  it('resolves scaling and minPlayers', () => {
    const L2 = parseLevel(def, 2);
    const L4 = parseLevel(def, 4);
    expect(L2.entities.find((e) => e.type === 'plate').need).toBe(2);
    expect(L4.entities.find((e) => e.type === 'plate').need).toBe(4);
    expect(L2.entities.find((e) => e.type === 'crate').weight).toBe(1);
    expect(L2.entities.some((e) => e.type === 'gate')).toBe(false);
    expect(L4.entities.some((e) => e.type === 'gate')).toBe(true);
  });

  it('converts entity tile coords to pixels', () => {
    const plate = parseLevel(def, 2).entities.find((e) => e.type === 'plate');
    expect(plate.x).toBe(128);
    expect(plate.y).toBe(128);
    expect(plate.w).toBe(64);
  });

  it('applies colorMap for the player count', () => {
    const d = { ...def, colorMap: { 2: { 2: 0, 3: 1 } }, entities: [{ type: 'cgate', x: 1, y: 1, color: 3 }] };
    expect(parseLevel(d, 2).entities[0].color).toBe(1);
    expect(parseLevel(d, 4).entities[0].color).toBe(3);
  });

  it('throws on missing key, door or fewer than 4 spawns', () => {
    expect(() => parseLevel({ id: 'x', map: ['#S#'], entities: [] }, 2)).toThrow(/spawn|key|door/);
  });

  it('throws on ragged map rows', () => {
    const d = { ...def, map: [...def.map.slice(0, 3), '#########'] };
    expect(() => parseLevel(d, 2)).toThrow(/row/);
  });
});
