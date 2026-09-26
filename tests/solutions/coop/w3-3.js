import { finish } from '../tether.js';
import { bounceOver } from '../bounce.js';

const across = (s, p) => s.blobs[p].grounded && s.blobs[p].x + 26 > 21 * 64 + 8 && s.blobs[p].y < 640;

// The front blob squishes at the edge; everyone else bounces off it in turn,
// then the team hauls the squisher across on the rope.
export default (n) => {
  const sq = n - 1;
  return [
    { do: 'walk', p: sq, to: 15 },
    { do: 'squish', p: sq, on: true },
    // Bring the rest of the team up close so no rope drags a bouncer back.
    { do: 'par', steps: Array.from({ length: n - 1 }, (_, k) => ({ do: 'walk', p: n - 2 - k, to: 12.5 - k * 1.1, tol: 20 })) },
    {
      do: 'dyn',
      label: 'bounce across',
      make: (s) => {
        const order = s.blobs.filter((b) => b.i !== sq).sort((a, b) => b.x - a.x).map((b) => b.i);
        return order.flatMap((p, k) => [
          ...bounceOver(p, 15),
          { do: 'until', label: `p${p} across`, test: (st) => across(st, p) },
          { do: 'walk', p, to: 24 - k * 1.2, tol: 30 },
        ]);
      },
    },
    { do: 'squish', p: sq, on: false },
    { do: 'hold', p: sq, bits: 2, ticks: 20 },
    { do: 'par', steps: Array.from({ length: n - 1 }, (_, k) => ({ do: 'walk', p: k, to: 33 + k * 1.2, tol: 30 })) },
    { do: 'until', label: 'hauled', test: (s) => across(s, sq) },
    finish(n, 32),
  ];
};
