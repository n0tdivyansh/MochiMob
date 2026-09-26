// Usage: node tools/check-levels.mjs [levelId...]
// Runs every co-op (n=2..4) and solo (n=2) solution and prints a compact report.
import { LEVELS } from '../src/levels/index.js';
import { validate } from '../src/levels/validate.js';
import { createWorld } from '../src/sim/world.js';
import { runScript } from '../src/bot/bot.js';

const only = process.argv.slice(2);
let failures = 0;
for (const def of LEVELS) {
  if (only.length && !only.includes(def.id)) continue;
  const line = [def.id.padEnd(5)];
  for (const n of [2, 3, 4]) {
    const errs = validate(def, n);
    if (errs.length) {
      line.push(`n${n}:INVALID(${errs.join('; ')})`);
      failures++;
    }
  }
  const coop = (await import(`../tests/solutions/coop/${def.id}.js`)).default;
  const solo = (await import(`../tests/solutions/solo/${def.id}.js`)).default;
  const runs = [
    ...[2, 3, 4].map((n) => [`c${n}`, createWorld(def, n), coop(n)]),
    ['s2', createWorld(def, 2, { solo: true }), solo(2)],
  ];
  for (const [label, state, script] of runs) {
    const r = runScript(state, script);
    const secs = (r.ticks / 60).toFixed(1);
    if (r.cleared) line.push(`${label}:ok ${secs}s`);
    else {
      failures++;
      const pos = state.blobs.map((b) => `${b.i}@${(b.x / 64).toFixed(1)},${((b.y + b.h) / 64).toFixed(1)}${b.alive ? '' : 'x'}${b.inDoor ? 'D' : ''}`).join(' ');
      line.push(`${label}:FAIL ${secs}s [${r.reason}] ${pos} key=${state.key.holder}`);
    }
  }
  console.log(line.join(' | '));
}
process.exit(failures ? 1 : 0);
