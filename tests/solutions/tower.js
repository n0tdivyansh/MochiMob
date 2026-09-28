import { FLOORS } from '../../src/levels/w4-4.js';

const T = 64;
const onRow = (b, row) => b.grounded && Math.abs(b.y + b.h - row * T) < 1;

// Climb the tower. mv(p, step) wraps a step for the play mode (solo adds a swap).
export function climbTower(mv) {
  return FLOORS.map((f, k) => ({
    do: 'dyn',
    label: `storey ${k}`,
    make: (s) => {
      const booth = s.cgates[k];
      const climber = s.blobs.find((b) => b.color === booth.color).i;
      const toLadder = f.ladder > 10 ? 1 : -1;
      // Nearest to the ladder climbs first so nobody has to squeeze past.
      const order = s.blobs.slice().sort((a, b) => toLadder * (b.x - a.x)).map((b) => b.i);
      const steps = [
        mv(climber, { do: 'walk', p: climber, to: f.booth + 0.5, hop: true, tol: 8 }),
        { do: 'until', label: `shutter ${k}`, test: (st) => st.gates[k].open >= 1 },
        mv(climber, { do: 'walkJump', p: climber, to: f.booth + 0.5 + toLadder * 2.5, at: f.booth + 0.5, tol: 20 }),
      ];
      const next = k + 1 < FLOORS.length ? FLOORS[k + 1] : null;
      order.forEach((p, j) => {
        steps.push(mv(p, { do: 'walk', p, to: f.ladder + 0.5, hop: true }));
        for (const r of f.rungs) {
          steps.push(mv(p, { do: 'jump', p }), { do: 'until', label: `p${p} rung ${r}`, timeout: 90, test: (st) => onRow(st.blobs[p], r) });
        }
        // Step off the ladder towards the next floor's work area.
        const away = next ? (next.ladder > 10 ? 13 - j : 6 + j) : 14 - j;
        steps.push(mv(p, { do: 'walk', p, to: away, tol: 12, hop: true }));
      });
      return steps;
    },
  }));
}
