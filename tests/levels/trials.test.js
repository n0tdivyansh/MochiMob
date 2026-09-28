import { describe, it, expect } from 'vitest';
import { TRIALS } from '../../src/levels/index.js';
import { validate } from '../../src/levels/validate.js';
import { createWorld } from '../../src/sim/world.js';
import { runScript } from '../../src/bot/bot.js';
import { TRIAL_SOLUTIONS } from '../solutions/trials.js';

describe.each(TRIALS.map((d) => [d.id, d]))('trial %s', (id, def) => {
  it('is a valid one-mochi level', () => {
    expect(validate(def, 1, { solo: true })).toEqual([]);
    expect(def.trial).toBe(true);
  });

  it('can be cleared by a single mochi under par', () => {
    const r = runScript(createWorld(def, 1, { solo: true }), TRIAL_SOLUTIONS[id]);
    expect(r.reason).toBeUndefined();
    expect(r.cleared).toBe(true);
    expect(r.ticks).toBeLessThan(def.par * 60);
  });
});
