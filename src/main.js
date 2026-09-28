// App controller: menus, level flow, input routing, save and settings.
import { createRenderer } from './render/renderer.js';
import { createInput } from './input/devices.js';
import { createSession } from './game/session.js';
import { createLoop } from './game/loop.js';
import { LEVELS, WORLDS, getLevel, nextLevelId } from './levels/index.js';
import { createAudio } from './audio/audio.js';
import { THEME_OF_WORLD } from './render/themes.js';
import { createSave } from './save.js';
import { createUI } from './ui/ui.js';
import { createScreens } from './ui/screens.js';
import { DEFAULT_BINDINGS } from './input/bindings.js';
import { createWorld } from './sim/world.js';
import { step } from './sim/step.js';

let storage = null;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}

const save = createSave(storage, LEVELS);
const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const input = createInput(window);
const audio = createAudio();
const ui = createUI(document.getElementById('ui'), { sfx: (n) => audio.sfx(n) });

const CLEAR_DELAY = 100; // ticks of celebration before the results card

const app = {
  save,
  input,
  audio,
  renderer,
  ui,
  levels: LEVELS,
  worlds: WORLDS,
  mode: 'solo',
  n: 2,
  devices: [],
  session: null,
  screen: 'title',
  world: 1,
  lastLevel: null,
  clearWait: -1,
};
const screens = createScreens(app);

const soloDevices = () => [{ kind: 'kb', slot: 0 }, { kind: 'kb', slot: 1 }, ...input.padIndices().map((index) => ({ kind: 'pad', index }))];

app.setMode = (mode, n, devices = []) => {
  app.mode = mode;
  app.n = n;
  app.devices = devices;
};

// Title background: four mochi hopping around the first meadow.
const demoDef = getLevel('w1-1');
let demo = null;
function resetDemo() {
  const state = createWorld(demoDef, 4);
  demo = { def: demoDef, state, prev: null, ticks: 0, emotes: [], hideHud: true };
  renderer.setLevel(demoDef, state);
}
function stepDemo() {
  const s = demo.state;
  const bits = s.blobs.map((b, i) => {
    const t = s.tick + i * 37;
    if (b.x < 300) b.ai.dir = 1;
    if (b.x > 700) b.ai.dir = -1;
    if (!b.ai.dir) b.ai.dir = i % 2 ? 1 : -1;
    let v = 0;
    if (t % 240 < 150) v |= b.ai.dir > 0 ? 2 : 1;
    if (t % (80 + i * 17) < 14) v |= 4;
    return v;
  });
  demo.prev = { blobs: s.blobs.map((b) => ({ x: b.x, y: b.y })), crates: [], lifts: [] };
  step(s, bits);
  renderer.onEvents(s, s.events.filter((e) => e.type === 'land' || e.type === 'jump'));
}

// Level flow
app.startLevel = (id) => {
  const def = getLevel(id);
  if (!def) return;
  const devices = app.mode === 'solo' ? soloDevices() : app.devices;
  app.session = createSession({ def, n: app.n, mode: app.mode, devices });
  app.lastLevel = id;
  app.world = def.world;
  app.clearWait = -1;
  renderer.setLevel(def, app.session.state);
  audio.play(THEME_OF_WORLD[def.world]);
  ui.hide();
  app.screen = 'playing';
  if (app.mode === 'solo' && !save.settings.soloTipSeen) {
    app.session.paused = true;
    screens.soloTip();
  }
};

app.resume = () => {
  if (!app.session) return;
  app.session.paused = false;
  ui.hide();
  app.screen = 'playing';
};

app.restart = () => {
  if (!app.session) return;
  app.session.restart();
  app.clearWait = -1;
  renderer.setLevel(app.session.def, app.session.state);
  app.resume();
};

app.quitToMap = () => {
  app.session = null;
  resetDemo();
  screens.map();
};

function pause() {
  app.session.paused = true;
  audio.sfx('back');
  screens.pause();
}

function finishLevel() {
  const s = app.session;
  const mode = app.mode === 'solo' ? 'solo' : 'coop';
  const result = save.recordClear(mode, s.def.id, s.ticks);
  const nextId = nextLevelId(s.def.id);
  screens.results({ ticks: s.ticks, stars: result.stars, newBest: result.newBest, nextId: nextId && save.isUnlocked(nextId) ? nextId : null });
}

// Settings
app.applySettings = () => {
  const s = save.settings;
  input.setBindings(s.bindings ?? DEFAULT_BINDINGS);
  audio.setVolumes(s);
  renderer.setSettings(s);
  document.body.classList.toggle('reduced', !!s.reducedMotion);
};

let capture = null;
app.captureKey = (cb) => {
  capture = cb;
};
window.addEventListener(
  'keydown',
  (e) => {
    if (!capture) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const cb = capture;
    capture = null;
    input.drainNav();
    input.drainPressed();
    cb(e.code);
  },
  true,
);

// Online probe: full online play arrives with the server (Phase D).
app.serverUrl = () => import.meta.env.VITE_SERVER_URL || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
app.probeServer = () =>
  new Promise((resolve) => {
    let done = false;
    let ws = null;
    const finish = (ok) => {
      if (done) return;
      done = true;
      try {
        ws?.close();
      } catch {
        // already closed
      }
      resolve(ok);
    };
    try {
      ws = new WebSocket(app.serverUrl());
      ws.onopen = () => finish(true);
      ws.onerror = () => finish(false);
      setTimeout(() => finish(false), 3000);
    } catch {
      finish(false);
    }
  });

// Local co-op joining: Jump joins a keyboard slot or gamepad, Squish leaves.
function handleJoin(pressed) {
  const joined = (app.joined = app.joined ?? []);
  let changed = false;
  for (const code of pressed) {
    input.bindings.forEach((b, slot) => {
      const i = joined.findIndex((d) => d.kind === 'kb' && d.slot === slot);
      if (code === b.jump && i < 0 && joined.length < 4) {
        joined.push({ kind: 'kb', slot });
        changed = true;
      } else if (code === b.squish && i >= 0) {
        joined.splice(i, 1);
        changed = true;
      }
    });
    const m = /^Pad(\d+):(\d+)$/.exec(code);
    if (m) {
      const index = Number(m[1]);
      const btn = Number(m[2]);
      const i = joined.findIndex((d) => d.kind === 'pad' && d.index === index);
      if (btn === 0 && i < 0 && joined.length < 4) {
        joined.push({ kind: 'pad', index });
        changed = true;
      } else if (btn === 1 && i >= 0) {
        joined.splice(i, 1);
        changed = true;
      }
    }
  }
  if (changed) {
    audio.sfx('ok');
    screens.localSetup();
  }
}

// Main loop
let lastDraw = performance.now();
const loop = createLoop({
  update() {
    input.poll();
    const pressed = input.drainPressed();
    const nav = input.drainNav();
    if (nav.length || pressed.length) audio.init();
    if (capture) return;

    if (app.screen === 'playing' && app.session) {
      if (nav.some((n) => n.action === 'back' || n.action === 'pause')) {
        pause();
        return;
      }
      const events = app.session.update(input, pressed);
      renderer.onEvents(app.session.state, events);
      audio.events(events);
      if (app.session.cleared) {
        if (app.clearWait < 0) app.clearWait = CLEAR_DELAY;
        else if (--app.clearWait === 0) finishLevel();
      }
      return;
    }

    if (app.screen === 'localSetup') handleJoin(pressed);
    for (const n of nav) {
      // Gamepad A/B join and leave on this screen; Start continues.
      if (app.screen === 'localSetup' && n.source !== 'kb') {
        if (n.action === 'pause') screens.startLocal();
        continue;
      }
      ui.nav(n.action);
    }
    if (!app.session) stepDemo();
  },
  render(alpha) {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastDraw) / 1000);
    lastDraw = now;
    renderer.draw(app.session ?? demo, app.session ? alpha : 1, dt, now / 1000);
  },
});

window.addEventListener('pointerdown', () => audio.init());
window.addEventListener('error', (e) => ui.toast(`Oops: ${e.message}`));
window.addEventListener('unhandledrejection', (e) => ui.toast(`Oops: ${e.reason?.message ?? e.reason}`));

app.applySettings();
resetDemo();

// Deep link for testing: ?play=w2-3&mode=local&n=3 jumps straight into a level.
const params = new URLSearchParams(location.search);
const deep = params.get('play');
if (deep && getLevel(deep)) {
  const n = Math.max(2, Math.min(4, Number(params.get('n')) || 2));
  const mode = params.get('mode') === 'local' ? 'local' : 'solo';
  app.setMode(mode, n, Array.from({ length: n }, (_, slot) => ({ kind: 'kb', slot })));
  app.startLevel(deep);
} else {
  screens.title();
}

loop.start();
window.__mochi = { app, loop, renderer, audio };
