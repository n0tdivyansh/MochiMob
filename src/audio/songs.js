// Original music, composed procedurally: a seeded motif in a chosen scale is
// repeated and varied (A A2 B A3) over a four-chord loop. Deterministic per seed.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCALES = {
  majorPenta: [0, 2, 4, 7, 9],
  minorPenta: [0, 3, 5, 7, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

function noteAt(root, scale, degree) {
  const oct = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  return root + oct * 12 + scale[idx];
}

// Rhythm: which of the 16 steps in a bar start a note.
const RHYTHMS = [
  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
];

function compose({ seed, root, scale, bpm, progression, rhythm = 0, hats }) {
  const r = rng(seed);
  const sc = SCALES[scale];
  const pattern = RHYTHMS[rhythm];
  // Motif: a small melodic walk over one bar.
  const motif = [];
  let deg = sc.length + Math.floor(r() * 3);
  for (let k = 0; k < 16; k++) {
    if (!pattern[k]) {
      motif.push(null);
      continue;
    }
    deg += [-2, -1, -1, 1, 1, 2, 0][Math.floor(r() * 7)];
    deg = Math.max(sc.length - 2, Math.min(sc.length * 2 + 1, deg));
    motif.push(deg);
  }
  const vary = (bar, shift, tailDown) =>
    bar.map((d, k) => (d === null ? null : d + shift + (tailDown && k > 11 ? -2 : 0)));
  const bars = [motif, vary(motif, 1, false), vary(motif, 3, false), vary(motif, 0, true)];
  const lead = bars.flat().map((d) => (d === null ? null : noteAt(root, sc, d)));
  const bass = progression.flatMap((deg) => {
    const n = noteAt(root - 24, sc, deg);
    return [n, null, null, null, n + 12, null, n, null, n, null, null, null, n + 7, null, n, null];
  });
  const chords = progression.map((deg) => [0, 2, 4].map((k) => noteAt(root - 12, sc, deg + k)));
  return { bpm, lead, bass, chords, hats };
}

const HATS_SOFT = [2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 1, 0, 0, 0, 1, 0];
const HATS_BUSY = [2, 0, 1, 1, 0, 1, 1, 0, 2, 0, 1, 1, 0, 1, 1, 1];
const HATS_NONE = [0];

export const SONGS = {
  title: compose({ seed: 11, root: 72, scale: 'majorPenta', bpm: 104, progression: [0, 3, 4, 2], hats: HATS_SOFT }),
  meadow: compose({ seed: 23, root: 72, scale: 'majorPenta', bpm: 116, progression: [0, 2, 3, 1], rhythm: 1, hats: HATS_SOFT }),
  works: compose({ seed: 37, root: 67, scale: 'dorian', bpm: 128, progression: [0, 3, 4, 3], rhythm: 2, hats: HATS_BUSY }),
  woods: compose({ seed: 41, root: 69, scale: 'minorPenta', bpm: 96, progression: [0, 3, 2, 4], hats: HATS_NONE }),
  peaks: compose({ seed: 53, root: 74, scale: 'lydian', bpm: 110, progression: [0, 4, 5, 3], rhythm: 1, hats: HATS_SOFT }),
};
