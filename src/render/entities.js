// Level objects drawn every frame in world space.
import { COLORS, GLYPHS, CONVEYOR } from '../sim/constants.js';
import { gateRect } from '../sim/collide.js';
import { roundedRect } from './tiles.js';
import { glyphPath } from './blobs.js';
import { THEMES } from './themes.js';

export function drawConveyors(ctx, conveyors, t) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,214,90,0.9)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const c of conveyors) {
    const phase = (((t * CONVEYOR * c.dir) % 32) + 32) % 32;
    ctx.save();
    ctx.beginPath();
    ctx.rect(c.x, c.y, 64, 18);
    ctx.clip();
    for (let k = -1; k < 3; k++) {
      const x = c.x + k * 32 + phase;
      ctx.beginPath();
      ctx.moveTo(x - 5 * c.dir, c.y + 4);
      ctx.lineTo(x + 3 * c.dir, c.y + 9);
      ctx.lineTo(x - 5 * c.dir, c.y + 14);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawPlate(ctx, p) {
  const depth = p.active ? 3 : 8;
  const x = p.x + 6;
  const w = p.w - 12;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundedRect(ctx, x - 2, p.y - 3, w + 4, 5, [2, 2, 0, 0]);
  ctx.fill();
  const base = p.color !== null ? COLORS[p.color] : p.active ? '#7fe08a' : '#ffcf4a';
  const g = ctx.createLinearGradient(0, p.y - depth, 0, p.y);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, base);
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  roundedRect(ctx, x, p.y - depth, w, depth, [5, 5, 0, 0]);
  ctx.fill();
  if (p.color !== null) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    glyphPath(ctx, GLYPHS[p.color], p.x + p.w / 2, p.y - depth - 12, 6);
    ctx.fill();
  }
  if (p.need > 1 && !p.latched) {
    ctx.font = 'bold 16px "Baloo 2", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(40,30,50,0.75)';
    ctx.fillText(`${Math.min(p.count, p.need)}/${p.need}`, p.x + p.w / 2, p.y - depth - 6);
  }
}

export function drawGate(ctx, g, theme) {
  const r = gateRect(g);
  if (!r) return;
  const th = THEMES[theme] ?? THEMES.works;
  ctx.save();
  roundedRect(ctx, r.x + 3, r.y, r.w - 6, r.h, [0, 0, 6, 6]);
  ctx.clip();
  ctx.fillStyle = th.edge;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = th.accent;
  for (let y = r.y + r.h - 40; y > r.y - 40; y -= 40) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y - 20);
    ctx.lineTo(r.x + r.w, y - 8);
    ctx.lineTo(r.x, y + 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(r.x + 5, r.y, 5, r.h);
  ctx.restore();
}

export function drawColorGate(ctx, g, t) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = COLORS[g.color];
  roundedRect(ctx, g.x + 2, g.y, g.w - 4, g.h, [4, 4, 4, 4]);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  const sweep = ((t * 120) % (g.h + 80)) - 40;
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(g.x, g.y + sweep);
  ctx.lineTo(g.x + g.w, g.y + sweep - 20);
  ctx.lineTo(g.x + g.w, g.y + sweep - 8);
  ctx.lineTo(g.x, g.y + sweep + 12);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#ffffff';
  if (g.h >= 40) {
    glyphPath(ctx, GLYPHS[g.color], g.x + g.w / 2, g.y + Math.min(g.h / 2, 40), 9);
    ctx.fill();
  } else {
    for (let x = g.x + 24; x < g.x + g.w; x += 48) {
      glyphPath(ctx, GLYPHS[g.color], x, g.y + g.h / 2, 5);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawLift(ctx, l, x, y, theme) {
  const th = THEMES[theme] ?? THEMES.meadow;
  const g = ctx.createLinearGradient(0, y, 0, y + l.h);
  g.addColorStop(0, th.body[0]);
  g.addColorStop(1, th.body[1]);
  ctx.fillStyle = g;
  roundedRect(ctx, x, y, l.w, l.h, [10, 10, 10, 10]);
  ctx.fill();
  ctx.fillStyle = th.top[0];
  roundedRect(ctx, x + 4, y, l.w - 8, 6, [4, 4, 0, 0]);
  ctx.fill();
  if (l.mode === 'weight' && l.need > 1) {
    ctx.font = 'bold 16px "Baloo 2", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(40,30,50,0.8)';
    ctx.fillText(`${Math.min(l.riders, l.need)}/${l.need}`, x + l.w / 2, y + l.h - 6);
  }
}

export function drawCrate(ctx, c, x, y) {
  ctx.fillStyle = 'rgba(30,20,40,0.18)';
  ctx.beginPath();
  ctx.ellipse(x + c.w / 2, y + c.h + 1, c.w * 0.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + c.h);
  g.addColorStop(0, '#f7c98b');
  g.addColorStop(1, '#c98a4b');
  ctx.fillStyle = g;
  roundedRect(ctx, x + 2, y + 2, c.w - 4, c.h - 2, [14, 14, 10, 10]);
  ctx.fill();
  // caramel glaze on top
  ctx.fillStyle = '#8a4f24';
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 10);
  for (let k = 0; k <= 4; k++) {
    const px = x + 6 + (k / 4) * (c.w - 12);
    ctx.quadraticCurveTo(px - 4, y + 16 + (k % 2) * 8, px, y + 10);
  }
  ctx.lineTo(x + c.w - 6, y + 4);
  ctx.quadraticCurveTo(x + c.w / 2, y - 2, x + 6, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x + c.w * 0.3, y + 7, c.w * 0.14, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();
  const n = Math.min(c.weight, 6);
  ctx.fillStyle = '#6b3b1a';
  for (let k = 0; k < n; k++) {
    ctx.beginPath();
    ctx.arc(x + c.w / 2 + (k - (n - 1) / 2) * 10, y + c.h - 14, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawKey(ctx, key, t) {
  if (key.holder === -2) return;
  const y = key.y + (key.holder === -1 ? Math.sin(t * 3) * 4 : 0);
  const x = key.x;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 38);
  glow.addColorStop(0, 'rgba(255,230,120,0.55)');
  glow.addColorStop(1, 'rgba(255,230,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 40, y - 40, 80, 80);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#ffcf3a';
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-9, 0, 8, 0, Math.PI * 2);
  ctx.rect(-2, -3, 20, 6);
  ctx.rect(12, 3, 4, 6);
  ctx.rect(6, 3, 4, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath();
  ctx.arc(-9, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawDoor(ctx, door, blobs, t) {
  const { x, y, w, h } = door;
  ctx.fillStyle = '#7a4b3a';
  roundedRect(ctx, x - 6, y - 6, w + 12, h + 6, [w / 2 + 6, w / 2 + 6, 0, 0]);
  ctx.fill();
  if (door.open) {
    const glow = ctx.createRadialGradient(x + w / 2, y + h * 0.6, 4, x + w / 2, y + h * 0.6, 110);
    glow.addColorStop(0, `rgba(255,236,160,${0.35 + 0.1 * Math.sin(t * 4)})`);
    glow.addColorStop(1, 'rgba(255,236,160,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 110, y - 70, w + 220, h + 140);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fff7c9');
    g.addColorStop(1, '#ffc46b');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = '#b5764f';
  }
  roundedRect(ctx, x, y, w, h, [w / 2, w / 2, 0, 0]);
  ctx.fill();
  const inside = blobs.filter((b) => b.inDoor);
  if (!door.open) {
    ctx.fillStyle = '#4a2b20';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.55, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + w / 2 - 2.5, y + h * 0.55, 5, 14);
  } else {
    inside.forEach((b, k) => {
      ctx.fillStyle = COLORS[b.color];
      ctx.beginPath();
      ctx.arc(x + w / 2 + (k - (inside.length - 1) / 2) * 13, y + 22, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.font = 'bold 18px "Baloo 2", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(60,30,40,0.6)';
  ctx.lineWidth = 4;
  const label = `${inside.length}/${blobs.length}`;
  ctx.strokeText(label, x + w / 2, y - 14);
  ctx.fillText(label, x + w / 2, y - 14);
}

export function drawCheckpoint(ctx, cp, t) {
  ctx.fillStyle = '#6d5a4c';
  ctx.fillRect(cp.x - 2, cp.y - 90, 4, 90);
  ctx.fillStyle = cp.active ? '#7fe08a' : '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cp.x + 2, cp.y - 88);
  for (let k = 0; k <= 8; k++) ctx.lineTo(cp.x + 2 + k * 5, cp.y - 88 + Math.sin(t * 6 + k * 0.7) * 2 * (k / 8));
  for (let k = 8; k >= 0; k--) ctx.lineTo(cp.x + 2 + k * 5, cp.y - 64 + Math.sin(t * 6 + k * 0.7) * 2 * (k / 8));
  ctx.closePath();
  ctx.fill();
}

export function drawPaint(ctx, p, t) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h - 4;
  ctx.fillStyle = COLORS[p.color];
  ctx.beginPath();
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const r = 1 + 0.06 * Math.sin(a * 4 + t * 3);
    ctx.lineTo(cx + Math.cos(a) * (p.w / 2 + 6) * r, cy + Math.sin(a) * 7 * r);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 2, 9, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.8 + k / 3) % 1;
    ctx.globalAlpha = 1 - ph;
    ctx.fillStyle = COLORS[p.color];
    ctx.beginPath();
    ctx.arc(cx + (k - 1) * 14, cy - 6 - ph * 36, 3 + k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Sagging rope between consecutive living blobs (pts are rope anchor points).
export function drawTether(ctx, pts, len) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k];
    const b = pts[k + 1];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const sag = Math.max(0, (len - d) * 0.35);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + sag, b.x, b.y);
    ctx.strokeStyle = '#6b4a33';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = '#c99b6d';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
