// Usage: node tools/trial-trace.mjs <trialId> [everyNthTick]
import { getLevel } from '../src/levels/index.js';
import { createWorld } from '../src/sim/world.js';
import { runScript } from '../src/bot/bot.js';
import { TRIAL_SOLUTIONS } from '../tests/solutions/trials.js';

const [id, every = '20'] = process.argv.slice(2);
const s = createWorld(getLevel(id), 1, { solo: true });
const r = runScript(s, TRIAL_SOLUTIONS[id], {
  onTick(st) {
    const b = st.blobs[0];
    const ev = st.events.map((e) => e.type).join(',');
    if (st.tick % Number(every) === 0 || ev.includes('die')) {
      console.log(`t${st.tick} col${(b.x / 64).toFixed(2)} bottom${((b.y + b.h) / 64).toFixed(2)} vx${b.vx.toFixed(0)} g${+b.grounded} sq${+b.squish} ${b.alive ? '' : 'DEAD'} ${ev}`);
    }
  },
});
console.log(r);
