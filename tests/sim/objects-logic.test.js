import { describe, it, expect } from 'vitest';
import { world, run, runEvents, ROOM, put } from './helpers.js';
import { overlap } from '../../src/sim/geom.js';
import { gateRect } from '../../src/sim/collide.js';
import { INPUT } from '../../src/sim/constants.js';

const { RIGHT } = INPUT;
const settle = (s) => run(s, 5);
const onPlate = (b, px) => {
  b.x = px;
  b.y = 272;
};

describe('pressure plates', () => {
  it('need:all is active only when every blob stands on it', () => {
    const s = world(ROOM, [{ type: 'plate', id: 'p', x: 10, y: 4, w: 2, need: 'all' }]);
    const [a, c] = s.blobs;
    settle(s);
    onPlate(a, 646);
    run(s, 3);
    expect(s.plates[0].active).toBe(false);
    expect(s.plates[0].count).toBe(1);
    onPlate(c, 710);
    const ev = runEvents(s, 3);
    expect(s.plates[0].active).toBe(true);
    expect(ev.some((e) => e.type === 'plateOn')).toBe(true);
    c.x = 100;
    run(s, 3);
    expect(s.plates[0].active).toBe(false);
  });

  it('latch plate stays active after everyone leaves', () => {
    const s = world(ROOM, [{ type: 'plate', id: 'p', x: 10, y: 4, need: 1, latch: true }]);
    const a = s.blobs[0];
    settle(s);
    onPlate(a, 646);
    run(s, 3);
    a.x = 100;
    run(s, 10);
    expect(s.plates[0].active).toBe(true);
  });

  it('colour plate ignores other colours and crates', () => {
    const s = world(ROOM, [
      { type: 'plate', id: 'p', x: 10, y: 4, w: 2, need: 1, color: 1 },
      { type: 'crate', x: 11, y: 4, w: 0.5, h: 0.5 },
    ]);
    const [a, c] = s.blobs;
    settle(s);
    onPlate(a, 646);
    run(s, 3);
    expect(s.plates[0].active).toBe(false);
    onPlate(c, 646);
    a.x = 100;
    run(s, 3);
    expect(s.plates[0].active).toBe(true);
  });

  it('a crate counts on an uncoloured plate', () => {
    const s = world(ROOM, [
      { type: 'plate', id: 'p', x: 10, y: 4, need: 1 },
      { type: 'crate', x: 10, y: 4, w: 0.75, h: 0.75 },
    ]);
    settle(s);
    expect(s.plates[0].active).toBe(true);
  });
});

describe('gates', () => {
  const plates = [
    { type: 'plate', id: 'p1', x: 3, y: 4 },
    { type: 'plate', id: 'p2', x: 5, y: 4 },
  ];

  it('mode any opens when a linked plate is active and closes after', () => {
    const s = world(ROOM, [...plates, { type: 'gate', id: 'g', x: 12, y: 2, h: 3, link: ['p1', 'p2'] }]);
    const a = s.blobs[0];
    settle(s);
    onPlate(a, 3 * 64 + 6);
    run(s, 30);
    expect(s.gates[0].open).toBe(1);
    expect(gateRect(s.gates[0])).toBe(null);
    a.x = 700;
    run(s, 30);
    expect(s.gates[0].open).toBe(0);
  });

  it('mode all needs every linked plate', () => {
    const s = world(ROOM, [...plates, { type: 'gate', id: 'g', x: 12, y: 2, h: 3, link: ['p1', 'p2'], mode: 'all' }]);
    const [a, c] = s.blobs;
    settle(s);
    onPlate(a, 3 * 64 + 6);
    c.x = 800;
    run(s, 30);
    expect(s.gates[0].open).toBe(0);
    onPlate(c, 5 * 64 + 6);
    run(s, 30);
    expect(s.gates[0].open).toBe(1);
  });

  it('does not close onto a body standing in its path', () => {
    const s = world(ROOM, [...plates, { type: 'gate', id: 'g', x: 12, y: 2, h: 3, link: ['p1'] }]);
    const [a, c] = s.blobs;
    settle(s);
    onPlate(a, 3 * 64 + 6);
    run(s, 30);
    c.x = 12 * 64 + 6;
    run(s, 3);
    a.x = 100;
    for (let t = 0; t < 60; t++) {
      run(s, 1);
      const r = gateRect(s.gates[0]);
      if (r) expect(overlap(r, c)).toBe(false);
    }
    expect(c.alive).toBe(true);
    expect(c.x).toBe(12 * 64 + 6);
    c.x = 900;
    run(s, 40);
    expect(s.gates[0].open).toBe(0);
  });
});

describe('colour and paint', () => {
  it('paint pool recolours a blob that then passes the matching colour gate', () => {
    const s = world(ROOM, [
      { type: 'paint', x: 6, y: 4, color: 1 },
      { type: 'cgate', x: 9, y: 2, h: 3, color: 1 },
    ]);
    const a = s.blobs[0];
    a.x = 5 * 64;
    settle(s);
    const ev = runEvents(s, 90, () => [RIGHT, 0]);
    expect(ev.some((e) => e.type === 'paint' && e.i === 0 && e.color === 1)).toBe(true);
    expect(a.color).toBe(1);
    expect(a.x).toBeGreaterThan(10 * 64);
  });
});

describe('crate recovery', () => {
  it('a crate that falls below the level returns home', () => {
    let map = put(ROOM, 12, 5, '.');
    map = put(map, 13, 5, '.');
    const s = world(map, [{ type: 'crate', x: 10, y: 4, weight: 1 }]);
    const a = s.blobs[0];
    a.x = 640 - 52;
    settle(s);
    const ev = [];
    for (let t = 0; t < 200; t++) {
      ev.push(...runEvents(s, 1, () => [t < 60 ? RIGHT : 0, 0]));
      if (ev.some((e) => e.type === 'crateReset')) break;
    }
    expect(ev.some((e) => e.type === 'crateReset')).toBe(true);
    expect(s.crates[0].x).toBe(640);
    expect(s.crates[0].y).toBe(256);
  });
});

describe('plate weight', () => {
  it('blobs stacked on a presser also count', () => {
    const s = world(ROOM, [{ type: 'plate', id: 'p', x: 10, y: 4, need: 2 }]);
    const [a, c] = s.blobs;
    settle(s);
    onPlate(a, 646);
    c.x = 646;
    c.y = 272 - 60;
    run(s, 20);
    expect(c.support).toEqual({ kind: 'blob', idx: 0 });
    expect(s.plates[0].count).toBe(2);
    expect(s.plates[0].active).toBe(true);
  });
});
