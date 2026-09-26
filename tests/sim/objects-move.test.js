import { describe, it, expect } from 'vitest';
import { world, run, ROOM, put } from './helpers.js';
import { overlap, deepOverlap } from '../../src/sim/geom.js';
import { INPUT } from '../../src/sim/constants.js';

const { LEFT, RIGHT, SQUISH } = INPUT;
const settle = (s) => run(s, 5);

describe('crates and pushing', () => {
  it('a weight-2 crate ignores one pusher and moves with two in a chain', () => {
    const s = world(ROOM, [{ type: 'crate', x: 8, y: 4, weight: 2 }]);
    const [a, c] = s.blobs;
    a.x = 512 - 52;
    c.x = 512 - 104;
    settle(s);
    const crate = s.crates[0];
    run(s, 30, () => [RIGHT, 0]);
    expect(crate.x).toBe(512);
    run(s, 30, () => [RIGHT, RIGHT]);
    expect(crate.x).toBeGreaterThan(512 + 60);
    expect(crate.x).toBeLessThan(512 + 110);
    expect(a.x + a.w).toBeCloseTo(crate.x, 0);
  });

  it('crate and pushers stop at a wall', () => {
    const s = world(ROOM, [{ type: 'crate', x: 16, y: 4, weight: 1 }]);
    const a = s.blobs[0];
    a.x = 16 * 64 - 52;
    settle(s);
    run(s, 120, () => [RIGHT, 0]);
    expect(s.crates[0].x).toBe(18 * 64);
    expect(a.x + a.w).toBe(18 * 64);
  });

  it('a blob standing on a pushed crate is carried', () => {
    const s = world(ROOM, [{ type: 'crate', x: 8, y: 4, weight: 1 }]);
    const [a, c] = s.blobs;
    a.x = 512 - 52;
    c.x = 512 + 6;
    c.y = 256 - 48 - 2;
    settle(s);
    expect(c.support).toEqual({ kind: 'crate', idx: 0 });
    const cx = c.x;
    const kx = s.crates[0].x;
    run(s, 30, () => [RIGHT, 0]);
    expect(c.x - cx).toBeCloseTo(s.crates[0].x - kx, 5);
    expect(s.crates[0].x - kx).toBeGreaterThan(50);
  });
});

describe('conveyors', () => {
  it('carry a squished blob under a low ceiling', () => {
    let map = ROOM;
    for (let col = 7; col <= 13; col++) map = put(map, col, 5, '>');
    map = put(map, 10, 4, 'v');
    const s = world(map);
    const b = s.blobs[0];
    b.x = 7 * 64 + 6;
    settle(s);
    run(s, 150, () => [SQUISH, 0]);
    expect(b.x).toBeGreaterThan(11 * 64);
    expect(b.squish).toBe(true);
  });
});

describe('lifts', () => {
  const liftEnt = (extra) => ({ type: 'lift', x: 10, y: 4.5, w: 2, ax: 10, ay: 4.5, bx: 10, by: 1.5, ...extra });

  it('weight lift rises only with enough riders and returns when they leave', () => {
    const s = world(ROOM, [liftEnt({ mode: 'weight', need: 2 })]);
    const lift = s.lifts[0];
    const [a, c] = s.blobs;
    a.x = 640 + 6;
    a.y = 288 - 48;
    settle(s);
    run(s, 60);
    expect(lift.y).toBe(288);
    c.x = 640 + 70;
    c.y = 288 - 48;
    run(s, 90);
    expect(lift.y).toBeLessThan(288 - 100);
    expect(a.y + a.h).toBeCloseTo(lift.y, 0);
    c.x = 200;
    c.y = 272;
    c.support = null;
    run(s, 200);
    expect(lift.y).toBe(288);
  });

  it('a tower of four blobs on a moving lift stays stacked', () => {
    const s = world(ROOM, [liftEnt({ mode: 'loop', ax: 8, ay: 4.5, bx: 13, by: 3, w: 2, speed: 120 })], 4);
    const lift = s.lifts[0];
    s.blobs.forEach((b, k) => {
      b.x = lift.x + 30;
      b.y = lift.y - 48 * (k + 1) - k;
    });
    run(s, 30);
    const base = s.blobs.map((b) => b.x - s.blobs[0].x);
    for (let t = 0; t < 600; t++) {
      run(s, 1);
      const bs = s.blobs;
      for (let i = 0; i < 4; i++) {
        expect(overlap(bs[i], lift)).toBe(false);
        for (let j = i + 1; j < 4; j++) expect(overlap(bs[i], bs[j])).toBe(false);
      }
      for (let k = 1; k < 4; k++) expect(Math.abs(bs[k].x - bs[0].x - base[k])).toBeLessThan(2);
      for (let k = 1; k < 4; k++) expect(bs[k].y + bs[k].h).toBeCloseTo(bs[k - 1].y, 0);
    }
    expect(s.blobs.every((b) => b.alive)).toBe(true);
  });

  it('a lift blocked by its rider at the ceiling waits instead of crushing', () => {
    const s = world(ROOM, [liftEnt({ mode: 'loop', by: 1 })]);
    const lift = s.lifts[0];
    const a = s.blobs[0];
    a.x = 640 + 6;
    a.y = 288 - 48;
    settle(s);
    let minLiftY = lift.y;
    for (let t = 0; t < 200; t++) {
      run(s, 1);
      minLiftY = Math.min(minLiftY, lift.y);
      expect(overlap(a, lift)).toBe(false);
    }
    expect(minLiftY).toBeGreaterThanOrEqual(64 + 48 - 0.01);
  });

  it('a descending lift is blocked by a blob underneath', () => {
    const s = world(ROOM, [{ type: 'lift', x: 10, y: 2, w: 2, ax: 10, ay: 2, bx: 10, by: 4.5, mode: 'loop' }]);
    const lift = s.lifts[0];
    const a = s.blobs[0];
    a.x = 640 + 6;
    settle(s);
    for (let t = 0; t < 200; t++) {
      run(s, 1);
      expect(overlap(a, lift)).toBe(false);
    }
    expect(lift.y + lift.h).toBeLessThanOrEqual(a.y + 0.01);
  });
});

describe('long push chains', () => {
  it('three blobs push a weight-3 crate without stuttering or overlapping', () => {
    const s = world(ROOM, [{ type: 'crate', x: 11, y: 4, weight: 3 }], 3);
    run(s, 5);
    for (let t = 0; t < 320; t++) {
      run(s, 1, () => [RIGHT, RIGHT, RIGHT]);
      const bs = s.blobs;
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(deepOverlap(bs[i], bs[j], 1e-6)).toBe(false);
    }
    expect(s.crates[0].x).toBe(18 * 64);
    expect(s.blobs[2].x + 52).toBe(18 * 64);
  });

  it('once contact is made the crate moves every tick until the wall', () => {
    const s = world(ROOM, [{ type: 'crate', x: 8, y: 4, weight: 3 }], 3);
    run(s, 5);
    let started = false;
    let stalls = 0;
    for (let t = 0; t < 200 && s.crates[0].x < 18 * 64; t++) {
      run(s, 1, () => [RIGHT, RIGHT, RIGHT]);
      if (s.crates[0].mx > 0) started = true;
      else if (started) stalls++;
    }
    expect(started).toBe(true);
    expect(stalls).toBe(0);
  });
});
