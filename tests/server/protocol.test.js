import { describe, it, expect } from 'vitest';
import { parse, validateClient, MAX_MSG } from '../../src/shared/protocol.js';

const LEVELS = new Set(['w1-1', 'w2-3']);
const ok = (m) => validateClient(m, LEVELS);

describe('protocol', () => {
  it('parses JSON objects with a string type', () => {
    expect(parse('{"type":"start"}')).toEqual({ ok: true, msg: { type: 'start' } });
    expect(parse('nope').ok).toBe(false);
    expect(parse('[1,2]').ok).toBe(false);
    expect(parse('{"type":5}').ok).toBe(false);
    expect(parse('x'.repeat(MAX_MSG + 1)).err).toBe('too_big');
  });

  it('accepts every valid client message', () => {
    for (const m of [
      { type: 'create', name: 'Mo' },
      { type: 'join', code: 'ABCD', name: '  Pip ' },
      { type: 'rejoin', token: 'a'.repeat(32) },
      { type: 'ready', on: true },
      { type: 'pick', level: 'w2-3' },
      { type: 'start' },
      { type: 'input', inputs: [[0, 3], [1, 31]] },
      { type: 'emote', id: 3 },
      { type: 'restart' },
      { type: 'quit' },
      { type: 'leave' },
      { type: 'ping', t: 123.5 },
    ]) {
      expect(ok(m).ok, JSON.stringify(m)).toBe(true);
    }
    expect(ok({ type: 'join', code: 'ABCD', name: '  Pip ' }).msg.name).toBe('Pip');
  });

  it('rejects wrong types, bad values and unknown messages', () => {
    for (const m of [
      { type: 'create', name: '' },
      { type: 'create', name: 'x'.repeat(17) },
      { type: 'create', name: 'bad\u0000name' },
      { type: 'create' },
      { type: 'join', code: 'ABC1', name: 'x' },
      { type: 'join', code: 'abcd', name: 'x' },
      { type: 'join', code: 'ABIO', name: 'x' },
      { type: 'rejoin', token: 'short' },
      { type: 'ready', on: 'yes' },
      { type: 'pick', level: 'w9-9' },
      { type: 'input', inputs: [] },
      { type: 'input', inputs: [[0, 3], [1, 3], [2, 3], [3, 3]] },
      { type: 'input', inputs: [[-1, 3]] },
      { type: 'input', inputs: [[0, 32]] },
      { type: 'input', inputs: [[0.5, 3]] },
      { type: 'input', inputs: 'lots' },
      { type: 'emote', id: 4 },
      { type: 'ping', t: 'now' },
      { type: 'hack' },
    ]) {
      expect(ok(m).ok, JSON.stringify(m)).toBe(false);
    }
  });
});
