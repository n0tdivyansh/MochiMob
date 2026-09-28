// Procedural parallax backdrops, pre-rendered once per theme as tiling strips.
import { hash } from './themes.js';

const STRIP_W = 2048;
const VIEW_W = 1920;
const VIEW_H = 1080;
const FACTORS = [0.08, 0.18, 0.32];

function strip(h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(STRIP_W, h);
  return Object.assign(document.createElement('canvas'), { width: STRIP_W, height: h });
}

// Periodic wave so strips tile seamlessly.
function wave(x, seed, amps) {
  let y = 0;
  amps.forEach(([a, k], i) => {
    y += a * Math.sin((x / STRIP_W) * Math.PI * 2 * k + hash(seed, i) * 6.283);
  });
  return y;
}

function hills(ctx, color, base, seed, amps) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  for (let x = 0; x <= STRIP_W; x += 8) ctx.lineTo(x, base + wave(x, seed, amps));
  ctx.lineTo(STRIP_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
}

function trees(ctx, color, base, seed, size) {
  hills(ctx, color, base + size * 0.6, seed, [[18, 2], [10, 5]]);
  ctx.fillStyle = color;
  const count = Math.round(STRIP_W / (size * 1.1));
  for (let i = 0; i < count; i++) {
    const x = (i / count) * STRIP_W + hash(seed, i) * size * 0.4;
    const s = size * (0.75 + hash(seed, i + 99) * 0.5);
    const y = base + wave(x, seed, [[18, 2], [10, 5]]);
    ctx.fillRect(x - s * 0.06, y - s * 0.2, s * 0.12, s * 0.9);
    for (const [dx, dy, r] of [[0, -0.55, 0.42], [-0.28, -0.3, 0.32], [0.28, -0.3, 0.32]]) {
      ctx.beginPath();
      ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function factory(ctx, color, base, seed, scale) {
  ctx.fillStyle = color;
  let x = 0;
  let i = 0;
  while (x < STRIP_W) {
    const w = (80 + hash(seed, i) * 140) * scale;
    const h = (120 + hash(seed, i + 7) * 260) * scale;
    ctx.fillRect(x, base - h, Math.min(w, STRIP_W - x), VIEW_H);
    if (hash(seed, i + 13) > 0.55) ctx.fillRect(x + w * 0.3, base - h - 90 * scale, 22 * scale, 90 * scale);
    if (hash(seed, i + 21) > 0.6) {
      const r = 34 * scale;
      const cx = x + w * 0.7;
      const cy = base - h;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const rr = k % 2 ? r : r * 1.25;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }
    x += w + (10 + hash(seed, i + 3) * 40) * scale;
    i++;
  }
}

function crystals(ctx, color, base, seed, scale) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  ctx.lineTo(0, base);
  let x = 0;
  let i = 0;
  while (x < STRIP_W) {
    const w = (60 + hash(seed, i) * 160) * scale;
    const h = (80 + hash(seed, i + 5) * 320) * scale;
    ctx.lineTo(x + w * 0.5, base - h);
    ctx.lineTo(Math.min(x + w, STRIP_W), base - hash(seed, i + 9) * 30);
    x += w;
    i++;
  }
  ctx.lineTo(STRIP_W, base);
  ctx.lineTo(STRIP_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
}

function clouds(ctx, seed, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 9; i++) {
    const x = hash(seed, i) * STRIP_W;
    const y = 120 + hash(seed, i + 30) * 280;
    const s = 50 + hash(seed, i + 60) * 60;
    for (const [dx, dy, r] of [[0, 0, 1], [-0.9, 0.25, 0.7], [0.9, 0.25, 0.75], [0.4, -0.35, 0.65]]) {
      for (const wrap of [0, STRIP_W, -STRIP_W]) {
        ctx.beginPath();
        ctx.arc(x + dx * s + wrap, y + dy * s, r * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

const cache = new Map();

function buildLayers(name, th) {
  const layers = [];
  const sky = strip(VIEW_H);
  clouds(sky.getContext('2d'), 5, name === 'works' ? 'rgba(255,245,230,0.55)' : 'rgba(255,255,255,0.75)');
  layers.push({ canvas: sky, factor: 0.03, drift: 6 });
  FACTORS.forEach((factor, k) => {
    const c = strip(VIEW_H);
    const ctx = c.getContext('2d');
    const base = 560 + k * 150;
    const color = th.layers[k];
    if (name === 'meadow') hills(ctx, color, base, k + 1, [[60 - k * 12, 1], [26, 3], [12, 7]]);
    else if (name === 'works') factory(ctx, color, base + 40, k + 1, 1 - k * 0.2);
    else if (name === 'woods') trees(ctx, color, base, k + 1, 220 - k * 50);
    else crystals(ctx, color, base, k + 1, 1.1 - k * 0.25);
    layers.push({ canvas: c, factor, drift: 0 });
  });
  return layers;
}

// Draw the backdrop in screen space (virtual 1920x1080). cam = {x, y}, t = seconds.
export function drawBackdrop(ctx, name, th, cam, t) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(0.55, th.sky[1]);
  g.addColorStop(1, th.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const sun = ctx.createRadialGradient(1480, 220, 10, 1480, 220, 420);
  sun.addColorStop(0, th.sun);
  sun.addColorStop(0.25, th.sun + 'aa');
  sun.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (!cache.has(name)) cache.set(name, buildLayers(name, th));
  for (const layer of cache.get(name)) {
    const shift = (cam.x * layer.factor + t * layer.drift) % STRIP_W;
    const off = -((shift + STRIP_W) % STRIP_W);
    const dy = -Math.min(120, Math.max(-120, (cam.y - 540) * layer.factor * 0.5));
    for (let x = off; x < VIEW_W; x += STRIP_W) ctx.drawImage(layer.canvas, x, dy);
  }
}
