import { describe, it, expect } from 'vitest';
import { createLoop } from '../../src/game/loop.js';
import { createSave } from '../../src/save.js';

describe('fixed-step loop', () => {
  const setup = () => {
    let updates = 0;
    let alpha = -1;
    const loop = createLoop({ update: () => updates++, render: (a) => (alpha = a) });
    return { loop, get updates() { return updates; }, get alpha() { return alpha; } };
  };

  it('runs 3 steps for a 50 ms frame and renders with an interpolation alpha', () => {
    const t = setup();
    t.loop.frame(1000);
    t.loop.frame(1050);
    expect(t.updates).toBe(3);
    expect(t.alpha).toBeGreaterThanOrEqual(0);
    expect(t.alpha).toBeLessThan(1);
  });

  it('never runs more than 5 steps in one frame (no spiral of death)', () => {
    const t = setup();
    t.loop.frame(0);
    t.loop.frame(1000);
    expect(t.updates).toBe(5);
    t.loop.frame(1016.7);
    expect(t.updates).toBe(6);
  });
});

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    data,
  };
}

const LEVELS = [
  { id: 'a', par: 60, gold: 30 },
  { id: 'b', par: 60, gold: 30 },
  { id: 'c', par: 60, gold: 30 },
];

describe('save data', () => {
  it('starts with defaults and only the first level unlocked', () => {
    const save = createSave(memoryStorage(), LEVELS);
    expect(save.settings.master).toBe(0.8);
    expect(save.isUnlocked('a')).toBe(true);
    expect(save.isUnlocked('b')).toBe(false);
  });

  it('records clears with stars and unlocks the next level in any mode', () => {
    const store = memoryStorage();
    const save = createSave(store, LEVELS);
    expect(save.recordClear('solo', 'a', 70 * 60)).toEqual({ stars: 1, best: 4200, newBest: true });
    expect(save.isUnlocked('b')).toBe(true);
    expect(save.recordClear('coop', 'a', 40 * 60).stars).toBe(2);
    expect(save.recordClear('coop', 'a', 20 * 60)).toEqual({ stars: 3, best: 1200, newBest: true });
    expect(save.recordClear('coop', 'a', 50 * 60)).toEqual({ stars: 3, best: 1200, newBest: false });
    expect(save.starsFor('solo', 'a')).toBe(1);
    const again = createSave(store, LEVELS);
    expect(again.starsFor('coop', 'a')).toBe(3);
  });

  it('survives corrupt or unavailable storage', () => {
    const save = createSave(memoryStorage({ 'mochi-mob-save': '{not json' }), LEVELS);
    expect(save.isUnlocked('a')).toBe(true);
    const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    const s2 = createSave(broken, LEVELS);
    expect(() => s2.recordClear('solo', 'a', 100)).not.toThrow();
    expect(s2.isUnlocked('b')).toBe(true);
  });

  it('persists settings changes', () => {
    const store = memoryStorage();
    createSave(store, LEVELS).saveSettings({ music: 0.2 });
    expect(createSave(store, LEVELS).settings.music).toBe(0.2);
  });
});

describe('separate unlock chains', () => {
  const MIXED = [
    { id: 'a', par: 60, gold: 30 },
    { id: 'b', par: 60, gold: 30 },
    { id: 't1', par: 60, gold: 30, trial: true },
    { id: 't2', par: 60, gold: 30, trial: true },
  ];

  it('the first trial is open from the start and trials unlock among themselves', () => {
    const save = createSave(memoryStorage(), MIXED);
    expect(save.isUnlocked('t1')).toBe(true);
    expect(save.isUnlocked('t2')).toBe(false);
    save.recordClear('solo', 'b', 100);
    expect(save.isUnlocked('t2')).toBe(false);
    save.recordClear('solo', 't1', 100);
    expect(save.isUnlocked('t2')).toBe(true);
  });
});
