import { describe, it, expect } from 'vitest';
import { world, run, runEvents, ROOM, put } from './helpers.js';
import { overlap } from '../../src/sim/geom.js';
import { INPUT, RESPAWN_TICKS } from '../../src/sim/constants.js';

const { RIGHT, UP } = INPUT;
const settle = (s) => run(s, 5);

describe('death and respawn', () => {
  it('spikes kill; blob respawns at its spawn after RESPAWN_TICKS', () => {
    const s = world(put(ROOM, 8, 4, '^'));
    const a = s.blobs[0];
    const spawn = { x: a.x, y: a.y };
    a.x = 7 * 64;
    settle(s);
    const ev = runEvents(s, 40, () => [RIGHT, 0]);
    const die = ev.find((e) => e.type === 'die');
    expect(die && die.i).toBe(0);
    expect(a.alive).toBe(false);
    const ev2 = runEvents(s, RESPAWN_TICKS + 2);
    expect(ev2.some((e) => e.type === 'respawn' && e.i === 0)).toBe(true);
    expect(a.alive).toBe(true);
    expect(a.x).toBeCloseTo(spawn.x, 5);
  });

  it('falling below the level kills', () => {
    const s = world(put(ROOM, 8, 5, '.'));
    const a = s.blobs[0];
    a.x = 8 * 64 + 6;
    settle(s);
    const ev = runEvents(s, 60);
    expect(ev.some((e) => e.type === 'die' && e.i === 0)).toBe(true);
  });

  it('respawn stacks above an occupant at the checkpoint', () => {
    const map = put(put(ROOM, 6, 4, 'C'), 12, 4, '^');
    const s = world(map);
    const [a, c] = s.blobs;
    a.x = 6 * 64 + 6;
    settle(s);
    expect(s.checkpoints[0].active).toBe(true);
    c.x = 6 * 64 + 6;
    c.y = 100;
    run(s, 30);
    a.x = 11 * 64 + 20;
    run(s, 40, () => [RIGHT, 0]);
    run(s, RESPAWN_TICKS + 5);
    expect(a.alive).toBe(true);
    expect(overlap(a, c)).toBe(false);
    run(s, 30);
    expect(overlap(a, c)).toBe(false);
    expect(a.y + a.h).toBeLessThanOrEqual(c.y + 0.01);
  });
});

describe('key and door', () => {
  it('key is picked up by touch and follows its holder', () => {
    const s = world();
    const a = s.blobs[0];
    a.x = 13 * 64;
    settle(s);
    const ev = runEvents(s, 30, () => [RIGHT, 0]);
    expect(ev.some((e) => e.type === 'key' && e.i === 0)).toBe(true);
    expect(s.key.holder).toBe(0);
    run(s, 60, () => [0, 0]);
    expect(Math.abs(s.key.x - (a.x + a.w / 2 - a.facing * 36))).toBeLessThan(3);
  });

  it('key drops near the holder last safe spot when the holder dies', () => {
    const map = put(ROOM, 16, 4, '^');
    const s = world(map);
    const a = s.blobs[0];
    a.x = 13 * 64;
    settle(s);
    run(s, 25, () => [RIGHT, 0]);
    expect(s.key.holder).toBe(0);
    run(s, 40, () => [RIGHT, 0]);
    expect(a.alive).toBe(false);
    expect(s.key.holder).toBe(-1);
    expect(s.key.x).toBeLessThan(16 * 64);
  });

  it('door opens only for the key holder', () => {
    const s = world();
    const [a, c] = s.blobs;
    c.x = 17 * 64;
    settle(s);
    run(s, 5);
    expect(s.door.open).toBe(false);
    c.x = 18 * 64 + 4;
    a.x = 13 * 64;
    const ev = runEvents(s, 80, () => [RIGHT, 0]);
    expect(ev.some((e) => e.type === 'unlock')).toBe(true);
    expect(s.door.open).toBe(true);
    expect(s.key.holder).toBe(-2);
  });

  it('once a teammate holds the key, anyone touching the door unlocks it', () => {
    const s = world();
    const [a, c] = s.blobs;
    settle(s);
    a.x = 14 * 64; // ROOM key sits at col 14
    run(s, 10);
    expect(s.key.holder).toBe(0);
    a.x = 3 * 64; // holder walks away from the door
    c.x = 17 * 64; // teammate stands in the doorway
    const ev = runEvents(s, 10);
    expect(ev.some((e) => e.type === 'unlock')).toBe(true);
    expect(s.door.open).toBe(true);
  });

  it('enter and exit with UP; clear once when everyone is inside', () => {
    const s = world();
    const [a, c] = s.blobs;
    s.door.open = true;
    s.key.holder = -2;
    a.x = 17 * 64 + 6;
    c.x = 17 * 64 + 6;
    c.y = 100;
    settle(s);
    run(s, 30);
    let ev = runEvents(s, 1, () => [UP, 0]);
    expect(ev.some((e) => e.type === 'enter' && e.i === 0)).toBe(true);
    expect(a.inDoor).toBe(true);
    run(s, 2);
    ev = runEvents(s, 1, () => [UP, 0]);
    expect(ev.some((e) => e.type === 'exit' && e.i === 0)).toBe(true);
    expect(a.inDoor).toBe(false);
    run(s, 5);
    runEvents(s, 1, () => [UP, 0]);
    run(s, 20);
    ev = runEvents(s, 1, () => [0, UP]);
    expect(ev.filter((e) => e.type === 'clear').length).toBe(1);
    expect(s.cleared).toBe(true);
    ev = runEvents(s, 30);
    expect(ev.some((e) => e.type === 'clear')).toBe(false);
  });

  it('cannot enter a closed door', () => {
    const s = world();
    const a = s.blobs[0];
    a.x = 17 * 64 + 6;
    settle(s);
    run(s, 1, () => [UP, 0]);
    expect(a.inDoor).toBe(false);
  });
});

describe('checkpoints', () => {
  it('touching a checkpoint moves the respawn point', () => {
    const s = world(put(ROOM, 8, 4, 'C'));
    const a = s.blobs[0];
    a.x = 7 * 64;
    settle(s);
    const ev = runEvents(s, 30, () => [RIGHT, 0]);
    expect(ev.some((e) => e.type === 'checkpoint')).toBe(true);
    expect(s.respawn).toEqual({ x: 8 * 64 + 32, y: 5 * 64 });
  });
});
