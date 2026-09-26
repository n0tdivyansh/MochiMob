// Hop straight onto a squished friend standing just to the right, then steer
// right only once launched so the bounce carries you over the gap.
export const bounceOver = (p, squisherCol, label = `p${p}`) => [
  { do: 'walk', p, px: squisherCol * 64 + 32 - 52 - 1, tol: 3 },
  { do: 'hold', p, bits: 4 | 2, ticks: 5 },
  { do: 'hold', p, bits: 4, ticks: 25 },
  { do: 'until', label: `${label} bounced`, timeout: 60, test: (s) => s.blobs[p].bounced && s.blobs[p].vy < 0 },
  { do: 'hold', p, bits: 2, ticks: 80 },
];
