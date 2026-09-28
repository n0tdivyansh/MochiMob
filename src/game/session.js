// A playable level: owns the sim state, keeps the previous tick for render
// interpolation, and turns device input into sim input for solo or local co-op.
import { createWorld } from '../sim/world.js';
import { step } from '../sim/step.js';
import { soloCommand } from '../sim/solo.js';
import { deviceBits } from '../input/devices.js';
import { SOLO_KEYS } from '../input/bindings.js';

const EMOTE_TICKS = 90;

function snapshotPositions(s) {
  const pick = (o) => ({ x: o.x, y: o.y });
  return { blobs: s.blobs.map(pick), crates: s.crates.map(pick), lifts: s.lifts.map(pick) };
}

// mode: 'solo' (every device drives the active blob) or 'local' (devices[i] drives blob i).
export function createSession({ def, n, mode, devices }) {
  const session = {
    def,
    n,
    mode,
    devices,
    state: null,
    prev: null,
    ticks: 0,
    emotes: [],
    cleared: false,
    paused: false,
    restart() {
      session.state = createWorld(def, n, { solo: mode === 'solo' });
      session.prev = snapshotPositions(session.state);
      session.ticks = 0;
      session.emotes = [];
      session.cleared = false;
    },
    // pressed: codes pressed since the last tick (input.drainPressed()).
    update(input, pressed) {
      if (session.paused) return [];
      const s = session.state;
      let bits;
      if (mode === 'solo') {
        for (const code of pressed) {
          if (code === SOLO_KEYS.prev || /^Pad\d+:4$/.test(code)) soloCommand(s, 'prev');
          else if (code === SOLO_KEYS.next || /^Pad\d+:5$/.test(code)) soloCommand(s, 'next');
          else if (code === SOLO_KEYS.follow || /^Pad\d+:3$/.test(code)) soloCommand(s, 'follow');
          else if (SOLO_KEYS.pick.includes(code)) soloCommand(s, SOLO_KEYS.pick.indexOf(code));
        }
        bits = devices.reduce((acc, d) => acc | deviceBits(input, d), 0);
      } else {
        bits = devices.map((d) => deviceBits(input, d));
        devices.forEach((d, i) => {
          const b = input.bindings[d.slot ?? 0];
          for (const code of pressed) {
            let id = -1;
            if (d.kind === 'kb') id = code === b.emote1 ? 0 : code === b.emote2 ? 1 : -1;
            else id = code === `Pad${d.index}:2` ? 0 : code === `Pad${d.index}:3` ? 1 : -1;
            if (id >= 0) session.emotes.push({ i, id, t: EMOTE_TICKS });
          }
        });
      }
      session.prev = snapshotPositions(s);
      step(s, bits);
      if (!session.cleared) session.ticks++;
      if (s.cleared) session.cleared = true;
      session.emotes = session.emotes.filter((e) => --e.t > 0);
      return s.events;
    },
  };
  session.restart();
  return session;
}
