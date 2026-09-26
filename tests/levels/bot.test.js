import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/sim/world.js';
import { runScript } from '../../src/bot/bot.js';

// Key sits on a 1-tile ledge (col 9-11); door at col 17.
const TINY = {
  id: 'tiny', world: 1, name: 'Tiny', par: 60, gold: 30,
  map: [
    '####################',
    '#..................#',
    '#..................#',
    '#.........K........#',
    '#........###.......#',
    '#SSSS............D.#',
    '####################',
  ],
  entities: [],
};

const coop = [
  { do: 'walk', p: 1, to: 7 },
  { do: 'walkJump', p: 1, to: 10, at: 7.6 },
  { do: 'until', test: (s) => s.key.holder === 1 },
  { do: 'walk', p: 1, to: 13 },
  { do: 'par', steps: [{ do: 'enter', p: 0 }, { do: 'enter', p: 1 }] },
];

const solo = [
  { do: 'swap', to: 1 },
  { do: 'walk', p: 1, to: 7 },
  { do: 'walkJump', p: 1, to: 10, at: 7.6 },
  { do: 'walk', p: 1, to: 13 },
  { do: 'enter', p: 1 },
  { do: 'enter', p: 0 },
];

const hop = [
  { do: 'walk', p: 0, to: 7, hop: true },
  { do: 'walkJump', p: 0, to: 10, at: 7.6 },
  { do: 'walk', p: 0, to: 13 },
  { do: 'par', steps: [{ do: 'enter', p: 0 }, { do: 'enter', p: 1 }] },
];

describe('bot', () => {
  it('clears a tiny level in co-op', () => {
    const r = runScript(createWorld(TINY, 2), coop);
    expect(r.reason).toBeUndefined();
    expect(r.cleared).toBe(true);
  });

  it('clears a tiny level in solo (auto-swap after entering)', () => {
    const r = runScript(createWorld(TINY, 2, { solo: true }), solo);
    expect(r.reason).toBeUndefined();
    expect(r.cleared).toBe(true);
  });

  it('walk with hop jumps over a teammate in the way', () => {
    const r = runScript(createWorld(TINY, 2), hop);
    expect(r.reason).toBeUndefined();
    expect(r.cleared).toBe(true);
  });

  it('reports a timeout reason when a step cannot finish', () => {
    const r = runScript(createWorld(TINY, 2), [{ do: 'until', test: () => false, timeout: 30 }]);
    expect(r.cleared).toBe(false);
    expect(r.reason).toMatch(/until/);
  });

  it('rejects solo steps for a non-active blob', () => {
    const r = runScript(createWorld(TINY, 2, { solo: true }), [{ do: 'walk', p: 1, to: 5 }]);
    expect(r.cleared).toBe(false);
    expect(r.reason).toMatch(/active/);
  });
});

describe('bot composition', () => {
  it('seq runs steps in order and dyn builds steps from live state', () => {
    const s = createWorld(TINY, 2);
    let seenX = null;
    const script = [
      {
        do: 'dyn',
        make: (st) => {
          seenX = st.blobs[1].x;
          return [{ do: 'seq', steps: [{ do: 'walk', p: 1, to: 6 }, { do: 'walk', p: 1, to: 8 }] }];
        },
      },
      { do: 'until', test: (st) => Math.abs(st.blobs[1].x + 26 - (8 * 64 + 32)) < 6 },
    ];
    const r = runScript(s, script, { maxTicks: 600 });
    expect(seenX).toBe(createWorld(TINY, 2).blobs[1].x);
    expect(r.reason).toBe('script ended without clear');
    expect(Math.abs(s.blobs[1].x + 26 - (8 * 64 + 32))).toBeLessThan(6);
  });
});
