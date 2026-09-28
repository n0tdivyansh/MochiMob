import { describe, it, expect } from 'vitest';
import { DEFAULT_BINDINGS, bitsFor, rebind } from '../../src/input/bindings.js';
import { INPUT } from '../../src/sim/constants.js';

describe('key bindings', () => {
  it('maps held keys of a slot to input bits; jump also means "up" for doors', () => {
    const down = new Set(['KeyD', 'KeyW']);
    expect(bitsFor(DEFAULT_BINDINGS[0], down)).toBe(INPUT.RIGHT | INPUT.JUMP | INPUT.UP);
    expect(bitsFor(DEFAULT_BINDINGS[1], down)).toBe(0);
    expect(bitsFor(DEFAULT_BINDINGS[1], new Set(['ArrowLeft', 'ArrowDown']))).toBe(INPUT.LEFT | INPUT.SQUISH);
  });

  it('has no duplicate keys across the four slots', () => {
    const codes = DEFAULT_BINDINGS.flatMap((b) => Object.values(b));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('rebinding to a key used elsewhere swaps the two keys', () => {
    const next = rebind(DEFAULT_BINDINGS, 0, 'jump', 'ArrowUp');
    expect(next[0].jump).toBe('ArrowUp');
    expect(next[1].jump).toBe('KeyW');
    expect(DEFAULT_BINDINGS[0].jump).toBe('KeyW'); // original untouched
  });

  it('rebinding to a free key just replaces it', () => {
    const next = rebind(DEFAULT_BINDINGS, 2, 'left', 'KeyZ');
    expect(next[2].left).toBe('KeyZ');
    expect(Object.values(next[2])).not.toContain('KeyJ');
  });
});
