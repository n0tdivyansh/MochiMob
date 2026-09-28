// Fixed-step game loop: update() runs at 60 Hz regardless of display rate,
// render(alpha) gets the fraction of a step left over for interpolation.
const STEP_MS = 1000 / 60;
const MAX_STEPS = 5;

export function createLoop({ update, render }) {
  let acc = 0;
  let last = null;
  let raf = 0;

  function frame(now) {
    if (last === null) last = now;
    acc += now - last;
    last = now;
    let steps = 0;
    while (acc >= STEP_MS - 1e-6 && steps < MAX_STEPS) {
      update();
      acc -= STEP_MS;
      steps++;
    }
    if (steps === MAX_STEPS) acc = 0; // drop the backlog after a stall
    render(Math.max(0, acc / STEP_MS));
    return steps;
  }

  const tick = (now) => {
    frame(now);
    raf = requestAnimationFrame(tick);
  };

  return {
    frame,
    start() {
      last = null;
      acc = 0;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
