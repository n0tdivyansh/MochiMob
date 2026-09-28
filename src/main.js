// Temporary boot: plays a level straight from the URL (menus arrive in Task 19).
import { createRenderer } from './render/renderer.js';
import { createInput } from './input/devices.js';
import { createSession } from './game/session.js';
import { createLoop } from './game/loop.js';
import { getLevel, LEVELS } from './levels/index.js';
import { createAudio } from './audio/audio.js';
import { THEME_OF_WORLD } from './render/themes.js';

const params = new URLSearchParams(location.search);
const def = getLevel(params.get('level') || 'w1-1') || LEVELS[0];
const mode = params.get('mode') === 'local' ? 'local' : 'solo';
const n = Math.max(2, Math.min(4, Number(params.get('n')) || 2));

const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const input = createInput(window);
const devices = mode === 'solo' ? [{ kind: 'kb', slot: 0 }, { kind: 'kb', slot: 1 }] : Array.from({ length: n }, (_, i) => ({ kind: 'kb', slot: i }));
const session = createSession({ def, n, mode, devices });
renderer.setLevel(def, session.state);
const audio = createAudio();
audio.play(THEME_OF_WORLD[def.world]);
const unlockAudio = () => audio.init();
window.addEventListener('keydown', unlockAudio);
window.addEventListener('pointerdown', unlockAudio);


let lastDraw = performance.now();
const loop = createLoop({
  update() {
    input.poll();
    const events = session.update(input, input.drainPressed());
    renderer.onEvents(session.state, events);
    audio.events(events);
  },
  render(alpha) {
    const now = performance.now();
    renderer.draw(session, alpha, Math.min(0.1, (now - lastDraw) / 1000), now / 1000);
    lastDraw = now;
  },
});
loop.start();
window.__mochi = { session, loop, renderer, audio };
