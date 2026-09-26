import { EDGE1, EDGE2, onCrate1, onStack, stairs, fell } from '../w1-5-parts.js';

export default (n) => {
  const base = n - 1;
  const top = n - 2;
  const rest = [];
  for (let p = n - 3; p >= 0; p--) rest.push(p);
  const steps = [
    // Tier 1: stack up, then kick crate 1 down as a step.
    { do: 'walk', p: base, to: 12 },
    { do: 'walk', p: top, to: 10 },
    { do: 'walkJump', p: top, to: 12, at: 11 },
    { do: 'jump', p: top, dir: 1 },
    { do: 'walk', p: top, to: 18, hop: true },
    { do: 'walk', p: base, to: 7 },
    { do: 'walk', p: top, px: EDGE1 },
    fell(0, 1700),
    { do: 'walk', p: top, to: 26 },
    ...onCrate1(base, 24),
  ];
  rest.forEach((p, k) => steps.push(...onCrate1(p, 17 - k)));
  // Tier 2: base bounces off top, then drops two crates into a stair.
  steps.push(
    { do: 'squish', p: top, on: true },
    { do: 'walk', p: base, to: 23 },
    { do: 'walkJump', p: base, to: 28, at: 25.2 },
    { do: 'walk', p: base, to: 30.5, hop: true },
    { do: 'squish', p: top, on: false },
    { do: 'walk', p: top, to: 21 },
    { do: 'walk', p: base, px: EDGE2 },
    fell(1, 1500),
    { do: 'walk', p: base, to: 33.2, hop: true },
    { do: 'walk', p: base, px: EDGE2 },
    fell(2, 1400),
    { do: 'walk', p: base, to: 31 },
    ...onStack(top, 30),
  );
  rest.forEach((p, k) => steps.push(...onStack(p, 29 - k)));
  // Summit: platform hops, one blob at a time.
  steps.push(...stairs(base, 26));
  steps.push(...stairs(top, 28));
  rest.forEach((p, k) => steps.push(...stairs(p, 30 + k)));
  steps.push({ do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) });
  return steps;
};
