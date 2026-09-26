import { describe, it, expect } from 'vitest';
import { world, ROOM, put } from './helpers.js';
import { moveX, moveY, overlapsSolid, nudgeFree } from '../../src/sim/collide.js';

describe('collision', () => {
  it('falls and lands exactly on the floor', () => {
    const s = world();
    const b = s.blobs[0];
    b.y -= 30;
    const r = moveY(s, b, 40);
    expect(r.hit).toBeTruthy();
    expect(b.y + b.h).toBe(320);
    expect(b.grounded).toBe(true);
    expect(b.support).toEqual({ kind: 'tile', code: 1 });
  });

  it('is blocked by a wall at its exact edge', () => {
    const s = world();
    const b = s.blobs[0];
    b.x = 19 * 64 - 52 - 10;
    const r = moveX(s, b, 20);
    expect(b.x + b.w).toBe(19 * 64);
    expect(r.hit.ref.kind).toBe('tile');
  });

  it('passes one-way platforms upward and lands on them from above', () => {
    const s = world(put(ROOM, 10, 3, '='));
    const b = s.blobs[0];
    b.x = 640 + 6;
    b.y = 212;
    expect(moveY(s, b, -24).hit).toBe(null);
    expect(b.y).toBe(188);
    b.y = 192 - 48 - 10;
    const r = moveY(s, b, 20);
    expect(r.hit.oneWay).toBe(true);
    expect(b.y + b.h).toBe(192);
  });

  it('does not tunnel through a thin gate on a big move', () => {
    const s = world(ROOM, [{ type: 'gate', id: 'g', x: 10, y: 3, w: 0.5, h: 2, link: ['nope'] }]);
    const b = s.blobs[0];
    b.x = 640 - 52 - 1;
    moveX(s, b, 60);
    expect(b.x + b.w).toBe(640);
  });

  it('blob blocks blob', () => {
    const s = world();
    const [a, c] = s.blobs;
    const r = moveX(s, a, 20);
    expect(a.x + a.w).toBe(c.x);
    expect(r.hit.ref).toEqual({ kind: 'blob', idx: 1 });
  });

  it('ignores dead and in-door blobs', () => {
    const s = world();
    const [a, c] = s.blobs;
    c.inDoor = true;
    expect(moveX(s, a, 20).hit).toBe(null);
  });

  it('squished blob fits under a low ceiling, normal blob does not', () => {
    const s = world(put(ROOM, 10, 4, 'v'));
    const b = s.blobs[0];
    b.x = 640 - 52 - 2;
    moveX(s, b, 10);
    expect(b.x + b.w).toBe(640);
    b.h = 24;
    b.y = 320 - 24;
    expect(moveX(s, b, 10).hit).toBe(null);
  });

  it('colour gate lets only matching blob through', () => {
    const s = world(ROOM, [{ type: 'cgate', x: 10, y: 3, h: 2, color: 1 }]);
    const [a, c] = s.blobs;
    a.x = 640 - 52 - 2;
    moveX(s, a, 10);
    expect(a.x + a.w).toBe(640);
    c.x = 640 - 52 - 2;
    c.y = a.y - 100; // keep them apart
    c.y = 272;
    a.y = 100;
    expect(moveX(s, c, 10).hit).toBe(null);
  });

  it('nudgeFree resolves a 10 px overlap into a wall', () => {
    const s = world();
    const b = s.blobs[0];
    b.x = 19 * 64 - 52 + 10;
    expect(overlapsSolid(s, b)).toBe(true);
    expect(nudgeFree(s, b)).toBe(true);
    expect(overlapsSolid(s, b)).toBe(false);
  });

  it('treats out-of-bounds columns as solid', () => {
    const map = ROOM.map((l, r) => (r === 4 ? '.' + l.slice(1) : l));
    const s = world(map);
    const b = s.blobs[0];
    b.x = 10;
    moveX(s, b, -30);
    expect(b.x).toBe(0);
  });
});
