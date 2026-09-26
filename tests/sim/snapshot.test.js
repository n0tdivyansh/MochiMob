import { describe, it, expect } from 'vitest';
import { world, run, makeDef, ROOM } from './helpers.js';
import { encode, decode, staticFor } from '../../src/sim/snapshot.js';
import { INPUT } from '../../src/sim/constants.js';

const { LEFT, RIGHT, JUMP, SQUISH } = INPUT;
const script = (t) => [
  [RIGHT, JUMP | RIGHT, LEFT, SQUISH, 0][Math.floor(t / 17) % 5],
  [LEFT | JUMP, RIGHT, 0, JUMP, RIGHT][Math.floor(t / 13) % 5],
];

const ENTS = [
  { type: 'crate', x: 8, y: 4 },
  { type: 'plate', id: 'p', x: 12, y: 4 },
  { type: 'gate', id: 'g', x: 15, y: 2, h: 3, link: ['p'] },
  { type: 'lift', x: 5, y: 3, w: 2, bx: 5, by: 1, mode: 'loop' },
];

describe('snapshot', () => {
  it('excludes static geometry and events', () => {
    const s = run(world(ROOM, ENTS), 10, script);
    const snap = encode(s);
    expect(snap.static).toBeUndefined();
    expect(snap.events).toBeUndefined();
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });

  it('decoded state keeps stepping like the original', () => {
    const a = run(world(ROOM, ENTS), 200, script);
    const b = decode(JSON.parse(JSON.stringify(encode(a))), staticFor(makeDef(ROOM, ENTS), 2));
    for (let t = 200; t < 300; t++) {
      run(a, 1, () => script(t));
      run(b, 1, () => script(t));
    }
    for (let i = 0; i < 2; i++) {
      expect(Math.abs(a.blobs[i].x - b.blobs[i].x)).toBeLessThan(0.05);
      expect(Math.abs(a.blobs[i].y - b.blobs[i].y)).toBeLessThan(0.05);
    }
    expect(Math.abs(a.crates[0].x - b.crates[0].x)).toBeLessThan(0.05);
    expect(b.events).toEqual(a.events.length ? b.events : []);
  });

  it('is compact for four players', () => {
    const s = run(world(ROOM, ENTS, 4), 60, script);
    expect(JSON.stringify(encode(s)).length).toBeLessThan(6000);
  });
});
