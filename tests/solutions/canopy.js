import { relayGate } from './relay.js';
import { crossGap } from './tether.js';

const byX = (s) => s.blobs.slice().sort((a, b) => b.x - a.x).map((b) => b.i); // front-most first

export function canopy(mv, solo) {
  return [
    relayGate(mv, { L: 7, G: 11, R: 13, gate: 0 }),
    {
      do: 'dyn',
      label: 'stack for key',
      make: (s) => {
        const [base, top, ...rest] = byX(s);
        const spots = [22, 20, 18.8, 17.6];
        // Move as a group so the rope never wedges anyone behind a teammate.
        const walks = [base, top, ...rest].map((p, k) => ({ do: 'walk', p, to: spots[k], hop: true, tol: k > 1 ? 30 : 4 }));
        return [
          ...(solo ? walks.map((w) => mv(w.p, w)) : [{ do: 'par', steps: walks }]),
          mv(top, { do: 'walkJump', p: top, to: 22, at: 21 }),
          mv(top, { do: 'jump', p: top }),
          { do: 'until', label: 'key', test: (st) => st.key.holder === top },
          // Hop down off the branch before the chasm run.
          mv(top, { do: 'walk', p: top, to: 24.6, tol: 10 }),
          { do: 'until', label: 'top down', test: (st) => st.blobs[top].grounded && st.blobs[top].y + 48 > 639 },
        ];
      },
    },
    { do: 'dyn', label: 'chasm', make: (s) => crossGap(byX(s), 26, 29, { solo, haul: 8 }) },
    {
      do: 'dyn',
      label: 'exit',
      make: (s) => {
        const holder = s.key.holder;
        const rest = s.blobs.map((b) => b.i).filter((i) => i !== holder);
        if (solo) {
          return [
            { do: 'swap', to: holder },
            { do: 'follow', on: true },
            { do: 'enter', p: holder },
            { do: 'follow', on: false },
            ...rest.flatMap((p) => [{ do: 'swap', to: p }, { do: 'enter', p }]),
          ];
        }
        // Roped together: everyone walks in at once, the key-holder opens the door on arrival.
        return [{ do: 'par', steps: [holder, ...rest].map((p) => ({ do: 'enter', p })) }];
      },
    },
  ];
}
