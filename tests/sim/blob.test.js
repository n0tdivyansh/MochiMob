import { describe, it, expect } from 'vitest';
import { world, run, runEvents, ROOM, put } from './helpers.js';
import { step } from '../../src/sim/step.js';
import { INPUT } from '../../src/sim/constants.js';

const { LEFT, RIGHT, JUMP, SQUISH } = INPUT;

function settle(s) {
  return run(s, 5);
}

// Room with a raised ledge (row 3, columns 8-11) so a blob can walk off it.
const LEDGE = [
  '####################',
  '#..................#',
  '#..................#',
  '#.......####.......#',
  '#SSSS.........K..D.#',
  '####################',
];

describe('blob movement', () => {
  it('jump apex is about v^2/2g (150-160 px)', () => {
    const s = settle(world());
    const y0 = s.blobs[0].y;
    let minY = y0;
    for (let t = 0; t < 60; t++) {
      step(s, [JUMP, 0]);
      minY = Math.min(minY, s.blobs[0].y);
    }
    const rise = y0 - minY;
    expect(rise).toBeGreaterThanOrEqual(150);
    expect(rise).toBeLessThanOrEqual(160);
  });

  it('releasing jump early gives a short hop', () => {
    const s = settle(world());
    const y0 = s.blobs[0].y;
    let minY = y0;
    for (let t = 0; t < 60; t++) {
      step(s, [t < 2 ? JUMP : 0, 0]);
      minY = Math.min(minY, s.blobs[0].y);
    }
    expect(y0 - minY).toBeLessThan(60);
    expect(y0 - minY).toBeGreaterThan(10);
  });

  it('jump emits a jump event', () => {
    const s = settle(world());
    const ev = runEvents(s, 1, () => [JUMP, 0]);
    expect(ev.some((e) => e.type === 'jump' && e.i === 0)).toBe(true);
  });

  it('coyote time: jump 4 ticks after leaving a ledge works, 8 does not', () => {
    for (const [delay, expectJump] of [[4, true], [8, false]]) {
      const s = world(LEDGE);
      const b = s.blobs[0];
      b.x = 12 * 64 - 60;
      b.y = 3 * 64 - 48;
      settle(s);
      expect(b.grounded).toBe(true);
      let t = 0;
      while (b.grounded && t < 100) {
        step(s, [RIGHT, 0]);
        t++;
      }
      expect(b.grounded).toBe(false);
      for (let k = 1; k < delay; k++) step(s, [RIGHT, 0]);
      const ev = runEvents(s, 1, () => [RIGHT | JUMP, 0]);
      expect(ev.some((e) => e.type === 'jump')).toBe(expectJump);
    }
  });

  it('jump buffer: pressing 5 ticks before landing still jumps', () => {
    const drop = (s) => {
      settle(s);
      const b = s.blobs[0];
      b.y -= 60;
      b.vy = 300;
      b.grounded = false;
      b.coyote = 0;
      return b;
    };
    const probe = world();
    const pb = drop(probe);
    let land = 0;
    while (!pb.grounded && land < 100) {
      step(probe, [0, 0]);
      land++;
    }
    expect(land).toBeGreaterThan(6);
    const s = world();
    drop(s);
    const events = [];
    for (let t = 0; t < land + 3; t++) {
      step(s, [t === land - 5 ? JUMP : 0, 0]);
      events.push(...s.events);
    }
    expect(events.some((e) => e.type === 'jump')).toBe(true);
  });

  it('reaches run speed within 8 ticks', () => {
    const s = settle(world());
    run(s, 8, () => [0, RIGHT]);
    expect(s.blobs[1].vx).toBeCloseTo(380, 5);
  });

  it('squish shrinks to 24 tall, keeps bottom and cannot move', () => {
    const s = settle(world());
    const b = s.blobs[0];
    const bottom = b.y + b.h;
    const x = b.x;
    run(s, 10, () => [SQUISH | RIGHT, 0]);
    expect(b.squish).toBe(true);
    expect(b.h).toBe(24);
    expect(b.y + b.h).toBeCloseTo(bottom, 5);
    expect(b.x).toBe(x);
    run(s, 3, () => [0, 0]);
    expect(b.squish).toBe(false);
    expect(b.h).toBe(48);
  });

  it('landing on a squished blob bounces it up hard', () => {
    const s = settle(world());
    const [a, c] = s.blobs;
    run(s, 2, () => [0, SQUISH]);
    a.x = c.x;
    a.y = c.y - 200;
    a.vy = 0;
    a.grounded = false;
    const ev = [];
    let minVy = 0;
    for (let t = 0; t < 40; t++) {
      step(s, [0, SQUISH]);
      ev.push(...s.events);
      minVy = Math.min(minVy, a.vy);
    }
    expect(ev.some((e) => e.type === 'bounce' && e.i === 0)).toBe(true);
    expect(minVy).toBeLessThanOrEqual(-1400);
  });

  it('cannot unsquish under a low ceiling, unsquishes once clear', () => {
    const s = world(put(ROOM, 10, 4, 'v'));
    const b = s.blobs[0];
    settle(s);
    run(s, 2, () => [SQUISH, 0]);
    b.x = 640 + 6;
    run(s, 3, () => [SQUISH, 0]);
    run(s, 5, () => [0, 0]);
    expect(b.squish).toBe(true);
    b.x = 800;
    run(s, 2, () => [0, 0]);
    expect(b.squish).toBe(false);
  });

  it('a jumping blob carries the blob standing on its head', () => {
    const s = settle(world());
    const [a, c] = s.blobs;
    c.x = a.x;
    c.y = a.y - 48 - 1;
    settle(s);
    expect(c.support).toEqual({ kind: 'blob', idx: 0 });
    const y0 = c.y;
    let minY = y0;
    for (let t = 0; t < 30; t++) {
      step(s, [JUMP, 0]);
      minY = Math.min(minY, c.y);
    }
    expect(y0 - minY).toBeGreaterThan(100);
  });

  it('two blobs in contact walking the same way both move', () => {
    const s = settle(world());
    const [a, c] = s.blobs;
    c.x = a.x + a.w;
    const ax = a.x;
    const cx = c.x;
    run(s, 20, () => [RIGHT, RIGHT]);
    expect(a.x - ax).toBeGreaterThan(80);
    expect(c.x - cx).toBeGreaterThan(80);
    expect(a.x + a.w).toBeLessThanOrEqual(c.x + 1e-6);
  });

  it('blob stands on another blob and can walk off', () => {
    const s = settle(world());
    const [a, c] = s.blobs;
    c.x = a.x;
    c.y = a.y - 60;
    run(s, 20);
    expect(c.y + c.h).toBeCloseTo(a.y, 5);
    run(s, 30, () => [0, RIGHT]);
    expect(c.y + c.h).toBeCloseTo(320, 5);
  });

  it('is deterministic', () => {
    const script = (t) => [
      [RIGHT, JUMP | RIGHT, LEFT, SQUISH, 0][Math.floor(t / 17) % 5],
      [LEFT | JUMP, RIGHT, 0, JUMP, RIGHT][Math.floor(t / 13) % 5],
    ];
    const a = run(world(), 300, script);
    const b = run(world(), 300, script);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
