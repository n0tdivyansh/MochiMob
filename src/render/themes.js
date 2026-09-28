// Colour palettes per world. Everything drawn is procedural and original.
export const THEMES = {
  meadow: {
    sky: ['#8fd3ff', '#cdeeff', '#fff4dc'],
    sun: '#fff6c8',
    layers: ['#c9ecd0', '#a6dc98', '#7cc66c', '#5aa954'],
    body: ['#d9a578', '#b27b52'],
    edge: '#8a5a3a',
    top: ['#8fdc62', '#5fb546'],
    speck: 'rgba(255,240,220,0.25)',
    plank: ['#e8b77e', '#b9844f'],
    accent: '#ff9fbf',
  },
  works: {
    sky: ['#ffcf9f', '#ffe4c4', '#fff4e6'],
    sun: '#ffe6b8',
    layers: ['#f2c7a5', '#e1a987', '#c98b6c', '#a86f57'],
    body: ['#9aa6ba', '#6f7a90'],
    edge: '#4d566a',
    top: ['#d8e0ec', '#aab5c6'],
    speck: 'rgba(255,255,255,0.18)',
    plank: ['#c7cfdb', '#8c97a9'],
    accent: '#ffcf4a',
  },
  woods: {
    sky: ['#9fdcc0', '#cdeedd', '#effaf1'],
    sun: '#f4ffe0',
    layers: ['#b3dcc4', '#7fbf9d', '#54987a', '#3a7a5f'],
    body: ['#8c6a52', '#5e4535'],
    edge: '#412f25',
    top: ['#8fd680', '#4fa257'],
    speck: 'rgba(255,230,200,0.18)',
    plank: ['#a07a5a', '#6d4f3a'],
    accent: '#ffe07a',
  },
  peaks: {
    sky: ['#c9b8ff', '#e8ddff', '#ffe3f1'],
    sun: '#ffffff',
    layers: ['#e6dcff', '#cbbcf6', '#a897e6', '#8676cf'],
    body: ['#d7d0ef', '#a99fcf'],
    edge: '#7c71a8',
    top: ['#ffffff', '#e5f2ff'],
    speck: 'rgba(255,255,255,0.35)',
    plank: ['#f4efff', '#c8bcf0'],
    accent: '#7fe3ff',
  },
};

export const THEME_OF_WORLD = { 1: 'meadow', 2: 'works', 3: 'woods', 4: 'peaks' };

// Deterministic hash noise in [0,1) for texture details.
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
