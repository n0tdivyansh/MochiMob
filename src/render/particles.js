// Pooled cosmetic particles (never touch the simulation).
const MAX = 600;
const CONFETTI = ['#ff7aa2', '#7fcf6a', '#ffd24d', '#a68bff', '#7fe3ff', '#ffffff'];

export function createParticles() {
  const pool = [];
  let reduced = false;

  function add(p) {
    if (pool.length >= MAX) pool.shift();
    pool.push(p);
  }

  const rnd = (a, b) => a + Math.random() * (b - a);

  return {
    setReduced(v) {
      reduced = v;
    },
    dust(x, y, n = 6) {
      for (let k = 0; k < (reduced ? 2 : n); k++) {
        add({ x: x + rnd(-14, 14), y, vx: rnd(-90, 90), vy: rnd(-90, -20), g: 200, life: rnd(0.3, 0.55), age: 0, r: rnd(3, 6), color: 'rgba(255,255,255,0.8)', kind: 'dot' });
      }
    },
    puff(x, y, color, n = 14) {
      for (let k = 0; k < (reduced ? 4 : n); k++) {
        const a = rnd(0, Math.PI * 2);
        const s = rnd(60, 260);
        add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 300, life: rnd(0.4, 0.8), age: 0, r: rnd(4, 9), color, kind: 'dot' });
      }
    },
    sparkle(x, y, n = 10, color = '#fff6c8') {
      for (let k = 0; k < (reduced ? 3 : n); k++) {
        const a = rnd(0, Math.PI * 2);
        const s = rnd(40, 180);
        add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0, life: rnd(0.4, 0.9), age: 0, r: rnd(3, 6), color, kind: 'star' });
      }
    },
    confetti(x, y, n = 80) {
      for (let k = 0; k < (reduced ? 16 : n); k++) {
        add({ x: x + rnd(-40, 40), y, vx: rnd(-420, 420), vy: rnd(-900, -300), g: 900, life: rnd(1.2, 2.2), age: 0, r: rnd(5, 9), color: CONFETTI[k % CONFETTI.length], kind: 'paper', spin: rnd(-10, 10) });
      }
    },
    update(dt) {
      for (let k = pool.length - 1; k >= 0; k--) {
        const p = pool[k];
        p.age += dt;
        if (p.age >= p.life) {
          pool.splice(k, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.vx *= 1 - dt * 1.5;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },
    draw(ctx) {
      for (const p of pool) {
        const f = 1 - p.age / p.life;
        ctx.globalAlpha = Math.min(1, f * 1.5);
        ctx.fillStyle = p.color;
        if (p.kind === 'dot') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (0.5 + f * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'star') {
          const r = p.r * f;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - r * 2);
          ctx.lineTo(p.x + r * 0.5, p.y - r * 0.5);
          ctx.lineTo(p.x + r * 2, p.y);
          ctx.lineTo(p.x + r * 0.5, p.y + r * 0.5);
          ctx.lineTo(p.x, p.y + r * 2);
          ctx.lineTo(p.x - r * 0.5, p.y + r * 0.5);
          ctx.lineTo(p.x - r * 2, p.y);
          ctx.lineTo(p.x - r * 0.5, p.y - r * 0.5);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.age * p.spin);
          ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}
