import { describe, it, expect } from 'vitest';
import { world, run, runEvents } from './helpers.js';
import { cameraTarget, spanLimits } from '../../src/sim/camera.js';
import { INPUT, MAX_SPAN_X } from '../../src/sim/constants.js';

const { LEFT, RIGHT } = INPUT;
const settle = (s) => run(s, 5);
const dist = (a, b) => Math.hypot(a.x + a.w / 2 - (b.x + b.w / 2), a.y + a.h / 2 - (b.y + b.h / 2));

// Ledge on the left (top y=320), open pit on the right.
const CLIFF = [
  '##############################',
  '#............................#',
  '#............................#',
  '#............................#',
  '#SSSS.....K.................D#',
  '#############.................',
  '#############.................',
  '#############.................',
  '#############.................',
  '#############.................',
];

const WIDE = [
  '#'.repeat(50),
  '#' + '.'.repeat(48) + '#',
  '#' + '.'.repeat(48) + '#',
  '#SSSS' + '.'.repeat(10) + 'K' + '.'.repeat(30) + 'D' + '.'.repeat(2) + '#',
  '#'.repeat(50),
];

describe('tether', () => {
  it('a grounded pair cannot separate beyond the rope length', () => {
    const s = world(CLIFF, [], 2, {}, { tether: true });
    const [a, c] = s.blobs;
    settle(s);
    run(s, 200, () => [LEFT, RIGHT]);
    expect(dist(a, c)).toBeLessThanOrEqual(s.tether.len + 2);
  });

  it('an airborne blob dangles below its anchored partner instead of falling', () => {
    const s = world(CLIFF, [], 2, {}, { tether: true });
    const [a, c] = s.blobs;
    a.x = 13 * 64 - 54;
    c.x = 13 * 64 + 20;
    c.y = 320 - 48;
    const ev = runEvents(s, 200);
    expect(ev.some((e) => e.type === 'die')).toBe(false);
    expect(c.alive).toBe(true);
    expect(c.y).toBeGreaterThan(320);
    expect(dist(a, c)).toBeLessThanOrEqual(s.tether.len + 2);
    expect(a.y + a.h).toBeCloseTo(320, 0);
  });

  it('the anchor walking away hauls the dangler back up onto the ledge', () => {
    const s = world(CLIFF, [], 2, {}, { tether: true });
    const [a, c] = s.blobs;
    a.x = 13 * 64 - 54;
    c.x = 13 * 64 + 20;
    c.y = 320 - 48;
    run(s, 120);
    run(s, 400, () => [LEFT, 0]);
    expect(c.alive).toBe(true);
    expect(c.y + c.h).toBeCloseTo(320, 0);
    expect(c.x + c.w).toBeLessThanOrEqual(13 * 64 + 1);
  });

  it('does nothing when the level has no tether', () => {
    const s = world(WIDE);
    settle(s);
    run(s, 200, () => [LEFT, RIGHT]);
    expect(dist(s.blobs[0], s.blobs[1])).toBeGreaterThan(400);
  });
});

describe('camera span limit', () => {
  it('blocks outward motion beyond MAX_SPAN_X but allows moving back', () => {
    const s = world(WIDE);
    const [a, c] = s.blobs;
    settle(s);
    run(s, 600, () => [0, RIGHT]);
    expect(c.x - a.x).toBeLessThanOrEqual(MAX_SPAN_X + 1e-6);
    expect(c.x - a.x).toBeGreaterThan(MAX_SPAN_X - 10);
    const x = c.x;
    run(s, 10, () => [0, LEFT]);
    expect(c.x).toBeLessThan(x - 20);
  });

  it('solo mode has no span limit', () => {
    const s = world(WIDE, [], 2, { solo: true });
    expect(spanLimits(s, s.blobs[0])).toBe(null);
  });

  it('camera target fits all blobs and stays inside the level', () => {
    const s = world(WIDE);
    settle(s);
    const cam = cameraTarget(s);
    expect(cam.zoom).toBeLessThanOrEqual(1.25);
    expect(cam.zoom).toBeGreaterThanOrEqual(0.65);
    const halfW = 1920 / cam.zoom / 2;
    expect(cam.x - halfW).toBeGreaterThanOrEqual(0);
    expect(cam.x + halfW).toBeLessThanOrEqual(s.static.W);
    for (const b of s.blobs) {
      expect(b.x).toBeGreaterThanOrEqual(cam.x - halfW);
      expect(b.x + b.w).toBeLessThanOrEqual(cam.x + halfW);
    }
  });

  it('solo camera keeps the active blob inside the inner 60%', () => {
    const s = world(WIDE, [], 2, { solo: true });
    settle(s);
    s.blobs[1].x = 1600;
    s.solo.active = 1;
    const cam = cameraTarget(s);
    const halfW = 1920 / cam.zoom / 2;
    const cx = s.blobs[1].x + s.blobs[1].w / 2;
    expect(Math.abs(cx - cam.x)).toBeLessThanOrEqual(halfW * 0.6);
  });
});

describe('camera zoom', () => {
  it('zooms in to 1.25 when the team is bunched together', () => {
    const s = world(WIDE);
    settle(s);
    expect(cameraTarget(s).zoom).toBeCloseTo(1.25, 5);
  });
});
