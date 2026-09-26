// Shared relay logic for 2-4. `mv(p, step)` wraps a step for the play mode
// (solo scripts prefix a swap so only the active blob moves).
const byX = (s) => s.blobs.map((b) => b).sort((a, b) => a.x - b.x).map((b) => b.i);

export function relayGate(mv, { L, G, R, gate }) {
  return {
    do: 'dyn',
    label: `gate ${gate}`,
    make: (s) => {
      const order = byX(s);
      const [holder, ...passers] = order; // back-most holds the near plate
      const steps = [];
      // Line up in front of the shutter, front-most first.
      passers.slice().reverse().forEach((p, k) => steps.push(mv(p, { do: 'walk', p, to: G - 1 - k, hop: true })));
      steps.push(mv(holder, { do: 'walk', p: holder, to: L, hop: true }));
      steps.push({ do: 'until', label: `gate ${gate} open`, test: (st) => st.gates[gate].open >= 1 });
      // Through the shutter; the last one through holds the far plate.
      const [last, ...ahead] = passers;
      ahead.slice().reverse().forEach((p) => steps.push(mv(p, { do: 'walk', p, to: R + 2 + passers.indexOf(p), hop: true })));
      steps.push(mv(last, { do: 'walk', p: last, to: R, hop: true }));
      steps.push(mv(holder, { do: 'walk', p: holder, to: R + 2, hop: true }));
      return steps;
    },
  };
}

export function finale(mv, n) {
  return {
    do: 'dyn',
    label: 'finale',
    make: (s) => {
      const order = byX(s).reverse(); // front-most first
      const steps = [];
      order.forEach((p, k) => steps.push(mv(p, { do: 'walk', p, to: 43.5 - k, tol: 8, hop: true })));
      steps.push({ do: 'until', label: 'latched', test: (st) => st.plates.find((pl) => pl.id === 'l3').latched });
      const lead = order[0];
      steps.push(mv(lead, { do: 'walk', p: lead, to: 52, hop: true }));
      if (n > 0) steps.push({ do: 'until', label: 'key', test: (st) => st.key.holder === lead });
      return steps;
    },
  };
}

export const GATES = [
  { L: 11, G: 14, R: 17, gate: 0 },
  { L: 24, G: 32, R: 35, gate: 1 },
];
