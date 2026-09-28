// Mochi blob characters: soft jelly bodies drawn procedurally each frame.
import { COLORS, GLYPHS } from '../sim/constants.js';

const SHADE = ['#e0487a', '#4fa63f', '#e0a91a', '#7b5ce0'];
const LIGHT = ['#ffd3e2', '#d9f5cf', '#fff1b8', '#e5dcff'];

export function glyphPath(ctx, kind, x, y, s) {
  ctx.beginPath();
  if (kind === 'heart') {
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.35, y - s, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.35, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  } else if (kind === 'leaf') {
    ctx.moveTo(x - s * 0.6, y + s * 0.5);
    ctx.quadraticCurveTo(x - s * 0.7, y - s * 0.7, x + s * 0.6, y - s * 0.6);
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.6, x - s * 0.6, y + s * 0.5);
  } else if (kind === 'star') {
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const r = k % 2 ? s * 0.42 : s * 0.9;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
  } else {
    ctx.arc(x, y, s * 0.7, Math.PI * 0.35, Math.PI * 1.65);
    ctx.arc(x + s * 0.35, y - s * 0.1, s * 0.55, Math.PI * 1.45, Math.PI * 0.55, true);
  }
  ctx.closePath();
}

// A soft rounded "mochi" outline centred on (0,0) with half sizes hw, hh.
function bodyPath(ctx, hw, hh, wob) {
  ctx.beginPath();
  const n = 28;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // Flatter bottom, rounder top; a gentle wobble ripples around the rim.
    const flat = s > 0 ? 0.92 + 0.08 * (1 - s) : 1;
    const r = 1 + wob * Math.sin(a * 3);
    const px = Math.sign(c) * Math.pow(Math.abs(c), 0.8) * hw * r;
    const py = Math.sign(s) * Math.pow(Math.abs(s), 0.9) * hh * r * flat;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// anim: per-blob visual state kept by the renderer ({ squashT, blink, lookX, lookY }).
export function drawBlob(ctx, b, x, y, anim, t, { active = false, glyphs = true } = {}) {
  const color = b.color;
  const baseH = b.squish ? b.h : 48;
  let sx = 1;
  let sy = 1;
  if (!b.squish) {
    const v = Math.max(-1, Math.min(1, b.vy / 1100));
    sy = 1 - v * 0.14;
    sx = 1 + v * 0.1;
    if (anim.squashT > 0) {
      sx += 0.22 * anim.squashT;
      sy -= 0.2 * anim.squashT;
    }
    const breathe = b.grounded && Math.abs(b.vx) < 20 ? Math.sin(t * 3 + color) * 0.025 : 0;
    sy += breathe;
    sx -= breathe;
  } else {
    sx = 1.12;
  }
  const hw = (b.w / 2) * sx + 2;
  const hh = (baseH / 2) * sy + 2;
  const cx = x + b.w / 2;
  const bottom = y + b.h;
  const cy = bottom - hh + 1;
  const lean = Math.max(-0.12, Math.min(0.12, b.vx / 3000));

  ctx.save();
  if (b.grounded) {
    ctx.fillStyle = 'rgba(30,20,40,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, bottom + 1, hw * 0.95, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(cx, cy);
  ctx.transform(1, 0, -lean, 1, 0, 0);

  const wob = Math.sin(t * 9 + color * 2) * (Math.abs(b.vx) > 40 ? 0.02 : 0.008);
  bodyPath(ctx, hw, hh, wob);
  const g = ctx.createRadialGradient(-hw * 0.35, -hh * 0.55, 2, 0, 0, Math.max(hw, hh) * 1.25);
  g.addColorStop(0, LIGHT[color]);
  g.addColorStop(0.45, COLORS[color]);
  g.addColorStop(1, SHADE[color]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(70,30,60,0.25)';
  ctx.stroke();

  // Glossy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-hw * 0.38, -hh * 0.52, hw * 0.22, hh * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(-hw * 0.12, -hh * 0.68, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Face
  const faceY = b.squish ? -hh * 0.05 : -hh * 0.08;
  const look = anim.lookX * 3;
  const eyeDX = hw * 0.34;
  const eyeR = b.squish ? 3.2 : 4.6;
  const blink = anim.blink > 0 ? 0.15 : 1;
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#2b1d33';
    ctx.beginPath();
    ctx.ellipse(side * eyeDX + look, faceY + anim.lookY * 2, eyeR, eyeR * 1.15 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    if (blink > 0.5) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(side * eyeDX + look - 1.4, faceY + anim.lookY * 2 - 1.8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,120,150,0.35)';
    ctx.beginPath();
    ctx.ellipse(side * hw * 0.56 + look * 0.5, faceY + 7, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Mouth: small "o" in the air, happy curve on the ground, flat line squished.
  ctx.strokeStyle = '#2b1d33';
  ctx.fillStyle = '#2b1d33';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (b.squish) {
    ctx.moveTo(-3 + look, faceY + 5);
    ctx.lineTo(3 + look, faceY + 5);
    ctx.stroke();
  } else if (!b.grounded) {
    ctx.ellipse(look, faceY + 7, 2.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(look, faceY + 4, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  if (glyphs) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    glyphPath(ctx, GLYPHS[color], hw * 0.02, hh * 0.52, b.squish ? 3.2 : 4.5);
    ctx.fill();
  }
  ctx.restore();

  if (active) {
    const ay = y - 20 + Math.sin(t * 5) * 4;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = SHADE[color];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 9, ay - 10);
    ctx.lineTo(cx + 9, ay - 10);
    ctx.lineTo(cx, ay);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// Per-blob animation state that lives only in the renderer.
export function makeBlobAnim() {
  return { squashT: 0, blink: 0, nextBlink: 2 + Math.random() * 3, lookX: 0, lookY: 0 };
}

export function updateBlobAnim(anim, b, dt) {
  anim.squashT = Math.max(0, anim.squashT - dt * 5);
  anim.nextBlink -= dt;
  if (anim.blink > 0) anim.blink -= dt;
  if (anim.nextBlink <= 0) {
    anim.blink = 0.12;
    anim.nextBlink = 2 + Math.random() * 3;
  }
  const tx = Math.max(-1, Math.min(1, b.vx / 300)) || b.facing * 0.4;
  const ty = Math.max(-1, Math.min(1, b.vy / 900));
  anim.lookX += (tx - anim.lookX) * Math.min(1, dt * 10);
  anim.lookY += (ty - anim.lookY) * Math.min(1, dt * 10);
}
