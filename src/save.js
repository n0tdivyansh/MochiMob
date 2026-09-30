// Progress + settings in localStorage. Every storage access is guarded: private
// windows, quota errors or corrupt JSON fall back to defaults and never throw.
const KEY = 'mochi-mob-save';

const DEFAULT_SETTINGS = {
  master: 0.8,
  music: 0.6,
  sfx: 0.8,
  reducedMotion: false,
  glyphs: true,
  bindings: null,
};

function read(storage) {
  try {
    const raw = storage && storage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && data.v === 1) return data;
  } catch {
    // fall through to defaults
  }
  return { v: 1, progress: { solo: {}, coop: {} }, settings: {} };
}

export function starRating(def, ticks) {
  const secs = ticks / 60;
  if (secs <= def.gold) return 3;
  if (secs <= def.par) return 2;
  return 1;
}

export function createSave(storage, levels) {
  const data = read(storage);
  data.progress.solo ??= {};
  data.progress.coop ??= {};
  const settings = { ...DEFAULT_SETTINGS, ...data.settings };

  const write = () => {
    const serialized = JSON.stringify({ ...data, settings });
    try {
      storage?.setItem(KEY, serialized);
    } catch {
      // storage unavailable: progress lives for this session only
    }
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.data?.setItem) {
        window.CrazyGames.SDK.data.setItem(KEY, serialized);
      }
    } catch {
      // SDK data module unavailable
    }
  };
  const cleared = (id) => !!(data.progress.solo[id] || data.progress.coop[id]);

  return {
    settings,
    saveSettings(patch) {
      Object.assign(settings, patch);
      write();
    },
    // Team levels and one-mochi trials each unlock in their own chain.
    isUnlocked(id) {
      const def = levels.find((l) => l.id === id);
      if (!def) return false;
      const chain = levels.filter((l) => !!l.trial === !!def.trial);
      const i = chain.indexOf(def);
      return i === 0 || cleared(chain[i - 1].id);
    },
    isCleared: cleared,
    starsFor(mode, id) {
      return data.progress[mode][id]?.stars ?? 0;
    },
    bestFor(mode, id) {
      return data.progress[mode][id]?.best ?? null;
    },
    recordClear(mode, id, ticks) {
      const def = levels.find((l) => l.id === id);
      const prev = data.progress[mode][id];
      const stars = Math.max(starRating(def, ticks), prev?.stars ?? 0);
      const newBest = !prev || ticks < prev.best;
      const best = newBest ? ticks : prev.best;
      data.progress[mode][id] = { stars, best };
      write();
      return { stars, best, newBest };
    },
  };
}
