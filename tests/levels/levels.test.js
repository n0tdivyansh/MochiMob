import { describe, it, expect } from 'vitest';
import { LEVELS } from '../../src/levels/index.js';
import { validate } from '../../src/levels/validate.js';
import { createWorld } from '../../src/sim/world.js';
import { runScript } from '../../src/bot/bot.js';

const coop = import.meta.glob('../solutions/coop/*.js', { eager: true });
const solo = import.meta.glob('../solutions/solo/*.js', { eager: true });

describe.each(LEVELS.map((d) => [d.id, d]))('level %s', (id, def) => {
  it.each([2, 3, 4])('is valid for %i players', (n) => {
    expect(validate(def, n)).toEqual([]);
  });

  it.each([2, 3, 4])('co-op solution clears with %i players under par', (n) => {
    const mod = coop[`../solutions/coop/${id}.js`];
    expect(mod, 'missing co-op solution').toBeTruthy();
    const r = runScript(createWorld(def, n), mod.default(n));
    expect(r.reason).toBeUndefined();
    expect(r.cleared).toBe(true);
    expect(r.ticks).toBeLessThan(def.par * 60);
  });

  it('solo solution clears with a 2-blob team under par', () => {
    const mod = solo[`../solutions/solo/${id}.js`];
    expect(mod, 'missing solo solution').toBeTruthy();
    const r = runScript(createWorld(def, 2, { solo: true }), mod.default(2));
    expect(r.reason).toBeUndefined();
    expect(r.cleared).toBe(true);
    expect(r.ticks).toBeLessThan(def.par * 60);
  });
});

it('level ids are unique and ordered by world', () => {
  const ids = LEVELS.map((l) => l.id);
  expect(new Set(ids).size).toBe(ids.length);
  const worlds = LEVELS.map((l) => l.world);
  expect([...worlds].sort()).toEqual(worlds);
});
