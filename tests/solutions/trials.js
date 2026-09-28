// Bot solutions for the one-mochi Solo Trials (blob 0 is the whole team).
const p = 0;

// Hop onto a spring pad standing just right of us, then steer right once launched.
const padHop = (padCol) => [
  { do: 'walk', px: padCol * 64 - 27, p, tol: 3 },
  { do: 'hold', p, bits: 4 | 2, ticks: 5 },
  { do: 'hold', p, bits: 4, ticks: 25 },
  { do: 'until', label: `bounced at ${padCol}`, timeout: 60, test: (s) => s.blobs[p].bounced && s.blobs[p].vy < 0 },
  { do: 'hold', p, bits: 2, ticks: 60 },
];
const key = { do: 'until', label: 'key', test: (s) => s.key.holder === p };
const enter = { do: 'enter', p };
const liftAt = (i, t) => ({ do: 'until', label: `lift ${i} at ${t}`, test: (s) => s.lifts[i].t === t && s.lifts[i].wait > 90 });

export const TRIAL_SOLUTIONS = {
  't-1': [
    { do: 'walk', p, to: 13, hop: true },
    { do: 'walkJump', p, to: 19, at: 14.6 },
    { do: 'walkJump', p, to: 24.5, at: 20.4 },
    { do: 'walk', p, to: 27, hop: true },
    key,
    { do: 'walk', p, to: 30 },
    enter,
  ],
  't-2': [...padHop(8), { do: 'walk', p, to: 13 }, ...padHop(15), { do: 'walk', p, to: 22 }, key, enter],
  't-3': [
    { do: 'walk', p, px: 17 * 64 - 26, tol: 4 },
    { do: 'walkJump', p, to: 17, at: 16 },
    { do: 'jump', p, dir: 1 },
    { do: 'walk', p, to: 26 },
    key,
    enter,
  ],
  't-4': [
    { do: 'walk', p, to: 21, hop: true, tol: 30 },
    { do: 'squish', p, on: true },
    { do: 'until', label: 'under the wall', test: (s) => s.blobs[p].x > 25 * 64 },
    { do: 'squish', p, on: false },
    { do: 'walk', p, to: 28 },
    { do: 'walkJump', p, to: 33, at: 29 },
    { do: 'walk', p, to: 37 },
    key,
    enter,
  ],
  't-5': [
    { do: 'walk', p, px: 12 * 64 - 26, tol: 4 },
    { do: 'until', label: 'shutter open', test: (s) => s.gates[0].open >= 1 },
    { do: 'walk', p, to: 22, hop: true },
    { do: 'walk', p, to: 26, hop: true },
    key,
    { do: 'walk', p, to: 30 },
    enter,
  ],
  't-6': [
    { do: 'walk', p, to: 10 },
    liftAt(0, 0),
    { do: 'walk', p, to: 12.5, hop: true, tol: 6 },
    liftAt(0, 1),
    { do: 'walkJump', p, to: 23, at: 20.6, tol: 8 },
    liftAt(1, 0),
    { do: 'walkJump', p, to: 35, at: 31.6 },
    { do: 'walk', p, to: 39 },
    key,
    enter,
  ],
  't-7': [
    { do: 'walk', p, to: 6, hop: true },
    { do: 'walk', p, to: 15, hop: true },
    { do: 'walk', p, to: 21, hop: true },
    { do: 'walk', p, to: 24 },
    { do: 'walk', p, to: 27.5 },
    { do: 'until', label: 'shutter open', test: (s) => s.gates[0].open >= 1 },
    { do: 'walk', p, to: 37 },
    key,
    enter,
  ],
  't-8': [
    ...padHop(6),
    { do: 'walk', p, px: 17 * 64, tol: 6 },
    { do: 'until', label: 'plate latched', test: (s) => s.plates[0].latched },
    { do: 'walk', p, to: 19, hop: true },
    { do: 'walk', p, to: 24, hop: true, tol: 30 },
    { do: 'squish', p, on: true },
    { do: 'until', label: 'under the wall', test: (s) => s.blobs[p].x > 28 * 64 },
    { do: 'squish', p, on: false },
    { do: 'walk', p, to: 35 },
    key,
    enter,
  ],
};
