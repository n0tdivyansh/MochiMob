// Rope-level helpers.
//
// Co-op: the whole team runs at the gap together and each blob jumps at the
// edge, so the rope rarely goes taut. Solo: the leader jumps with Follow on and
// keeps walking; the follower stops at the edge, gets dragged in, and is hauled
// up the far side by the rope.
export const crossGap = (order, edge, far, { solo = false, haul = 11 } = {}) => {
  if (solo) {
    const lead = order[0];
    return [
      { do: 'swap', to: lead },
      { do: 'follow', on: true },
      { do: 'walk', p: lead, to: edge - 2.5, hop: true },
      { do: 'walkJump', p: lead, to: far + 1, at: edge - 0.45, hop: true, tol: 40 },
      { do: 'walk', p: lead, to: far + haul, hop: true, tol: 40 },
      { do: 'until', label: 'team across', test: (s) => s.blobs.every((b) => b.alive && b.grounded && b.x > far * 64) },
      { do: 'follow', on: false },
    ];
  }
  return [
    { do: 'par', steps: order.map((p, k) => ({ do: 'walk', p, to: edge - 1.5 - k * 1.1, hop: true, tol: 30 })) },
    {
      do: 'par',
      steps: order.map((p, k) => ({ do: 'walkJump', p, to: far + 1 + (order.length - 1 - k) * 1.3, at: edge - 0.45, hop: true, tol: 40 })),
    },
  ];
};

// The front-most blob (by position) fetches the key, then everyone heads in.
export const finish = (n, keyCol, { solo = false } = {}) => ({
  do: 'dyn',
  label: 'finish',
  make: (s) => {
    const order = s.blobs.slice().sort((a, b) => b.x - a.x).map((b) => b.i);
    const lead = order[0];
    if (solo) {
      return [
        { do: 'swap', to: lead },
        { do: 'follow', on: true },
        { do: 'walk', p: lead, to: keyCol + 1, hop: true, tol: 30 },
        { do: 'until', label: 'key', test: (st) => st.key.holder === lead },
        { do: 'enter', p: lead },
        { do: 'follow', on: false },
        ...order.slice(1).flatMap((p) => [{ do: 'swap', to: p }, { do: 'enter', p }]),
      ];
    }
    return [
      { do: 'walk', p: lead, to: keyCol + 1, hop: true, tol: 30 },
      { do: 'until', label: 'key', test: (st) => st.key.holder === lead },
      { do: 'par', steps: Array.from({ length: n }, (_, p) => ({ do: 'enter', p })) },
    ];
  },
});
