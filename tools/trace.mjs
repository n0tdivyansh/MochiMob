// Usage: node tools/trace.mjs <levelId> <mode c2|c3|c4|s2> <blob> [fromTick] [toTick]
import { getLevel } from '../src/levels/index.js';
import { createWorld } from '../src/sim/world.js';
import { runScript } from '../src/bot/bot.js';

const [id, mode, who, from = '0', to = '99999'] = process.argv.slice(2);
const def = getLevel(id);
const n = Number(mode[1]);
const solo = mode[0] === 's';
const script = (await import(`../tests/solutions/${solo ? 'solo' : 'coop'}/${id}.js`)).default(n);
const state = createWorld(def, n, { solo });
const p = Number(who);
const r = runScript(state, script, {
  onTick(s) {
    if (s.tick < +from || s.tick > +to) return;
    const b = s.blobs[p];
    const ev = s.events.map((e) => e.type).join(',');
    console.log(`t${s.tick} x${b.x.toFixed(1)} y${b.y.toFixed(1)} vx${b.vx.toFixed(0)} vy${b.vy.toFixed(0)} g${+b.grounded} in${b.prev} ${b.alive ? '' : 'DEAD'} ${ev}`);
  },
});
console.log(r);
