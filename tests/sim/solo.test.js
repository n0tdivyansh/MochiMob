import { describe, it, expect } from 'vitest';
import { world, run, runEvents, ROOM, put } from './helpers.js';
import { soloCommand } from '../../src/sim/solo.js';
import { step } from '../../src/sim/step.js';
import { INPUT } from '../../src/sim/constants.js';

const { LEFT, RIGHT, SQUISH, UP } = INPUT;
const solo = (map = ROOM, ents = [], n = 2) => world(map, ents, n, { solo: true });
const settle = (s) => run(s, 5, () => 0);

describe('solo swapping', () => {
  it('next/prev cycle and skip dead blobs', () => {
    const s = solo(ROOM, [], 3);
    settle(s);
    soloCommand(s, 'next');
    expect(s.solo.active).toBe(1);
    s.blobs[2].alive = false;
    soloCommand(s, 'next');
    expect(s.solo.active).toBe(0);
    soloCommand(s, 'prev');
    expect(s.solo.active).toBe(1);
    soloCommand(s, 2);
    expect(s.solo.active).toBe(1);
    soloCommand(s, 0);
    expect(s.solo.active).toBe(0);
  });

  it('only the active blob receives player input', () => {
    const s = solo();
    settle(s);
    const x1 = s.blobs[1].x;
    run(s, 20, () => RIGHT);
    expect(s.blobs[1].x).toBe(x1);
    soloCommand(s, 'next');
    const x0 = s.blobs[0].x;
    run(s, 20, () => LEFT);
    expect(s.blobs[0].x).toBe(x0);
    expect(s.blobs[1].x).toBeLessThan(x1 + 60);
  });

  it('an idle squished blob stays squished after swapping away', () => {
    const s = solo();
    settle(s);
    run(s, 3, () => SQUISH);
    expect(s.blobs[0].squish).toBe(true);
    soloCommand(s, 'next');
    run(s, 30, () => 0);
    expect(s.blobs[0].squish).toBe(true);
  });

  it('auto-swaps when the active blob enters the door', () => {
    const s = solo();
    s.door.open = true;
    s.key.holder = -2;
    s.blobs[0].x = 17 * 64 + 6;
    settle(s);
    const ev = runEvents(s, 1, () => UP);
    expect(s.blobs[0].inDoor).toBe(true);
    expect(s.solo.active).toBe(1);
    expect(ev.some((e) => e.type === 'swap' && e.active === 1)).toBe(true);
  });
});

describe('follow AI', () => {
  it('idle blob follows and stops near the active blob', () => {
    const s = solo();
    settle(s);
    soloCommand(s, 1);
    soloCommand(s, 'follow');
    expect(s.solo.follow).toBe(true);
    run(s, 90, () => RIGHT);
    run(s, 60, () => 0);
    const [a, b] = s.blobs;
    const gap = Math.abs(a.x - b.x);
    expect(gap).toBeGreaterThan(52);
    expect(gap).toBeLessThan(72 + 70);
  });

  it('jumps up a one-tile step to keep following', () => {
    const map = [
      '####################',
      '#..................#',
      '#.............K..D.#',
      '#..................#',
      '#SSSS.....#########' + '#',
      '####################',
    ].map((l) => l.slice(0, 20));
    const s = solo(map);
    const [a, b] = s.blobs;
    a.x = 14 * 64;
    a.y = 4 * 64 - 48;
    b.x = 2 * 64;
    settle(s);
    soloCommand(s, 'follow');
    run(s, 240, () => 0);
    expect(b.y + b.h).toBeCloseTo(256, 0);
    expect(b.alive).toBe(true);
  });

  it('refuses to walk off a ledge into a pit', () => {
    let map = ROOM;
    map = put(map, 8, 5, '.');
    map = put(map, 9, 5, '.');
    const s = solo(map);
    const [a, b] = s.blobs;
    a.x = 14 * 64;
    b.x = 3 * 64;
    settle(s);
    soloCommand(s, 'follow');
    const ev = runEvents(s, 300, () => 0);
    expect(ev.some((e) => e.type === 'die')).toBe(false);
    expect(b.x + b.w).toBeLessThanOrEqual(8 * 64 + 12);
  });

  it('does not move idle blobs when follow is off', () => {
    const s = solo();
    settle(s);
    const x1 = s.blobs[1].x;
    run(s, 60, () => RIGHT);
    expect(s.blobs[1].x).toBe(x1);
  });

  it('accepts inputs as a number or a one-element array', () => {
    const a = solo();
    const b = solo();
    for (let t = 0; t < 30; t++) {
      step(a, RIGHT);
      step(b, [RIGHT]);
    }
    expect(a.blobs[0].x).toBe(b.blobs[0].x);
  });
});

describe('follow AI pushing', () => {
  it('followers help the active blob push a heavy crate', () => {
    const s = solo(ROOM, [{ type: 'crate', x: 8, y: 4, weight: 2 }]);
    const [a, b] = s.blobs;
    b.x = 8 * 64 - 52;
    a.x = 8 * 64 - 110;
    soloCommand(s, 1);
    settle(s);
    soloCommand(s, 'follow');
    run(s, 60, () => RIGHT);
    expect(s.crates[0].x).toBeGreaterThan(8 * 64 + 60);
  });
});
