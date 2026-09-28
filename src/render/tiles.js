// Bakes the static tiles of a level into one offscreen canvas per level load.
// ponytail: single full-level canvas at 1x (max 3840x1920); chunk it if levels grow.
import { TILE, T, ONEWAY_H, LOW_H, PAD_H, SPIKE_H } from '../sim/constants.js';
import { hash } from './themes.js';

const R = 14;

function solidAt(st, c, r) {
  if (c < 0 || c >= st.cols) return true;
  if (r < 0) return false;
  if (r >= st.rows) return solidAt(st, c, st.rows - 1); // ground continues below the map
  const code = st.tiles[r * st.cols + c];
  return code === T.SOLID || code === T.CONV_R || code === T.CONV_L;
}

export function roundedRect(ctx, x, y, w, h, [tl, tr, br, bl]) {
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr) ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  if (br) ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  if (bl) ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  if (tl) ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function shadeBand(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, 'rgba(40,20,10,0.28)');
  g.addColorStop(1, 'rgba(40,20,10,0)');
  return g;
}

function drawSolid(ctx, st, c, r, th, trimTheme, low = false) {
  const x = c * TILE;
  const y = r * TILE;
  const h = low ? LOW_H : TILE;
  const up = solidAt(st, c, r - 1);
  const dn = low ? false : solidAt(st, c, r + 1);
  const lf = solidAt(st, c - 1, r);
  const rt = solidAt(st, c + 1, r);
  const corners = [!up && !lf ? R : 0, !up && !rt ? R : 0, !dn && !rt ? R : 0, !dn && !lf ? R : 0];
  const grad = ctx.createLinearGradient(0, y, 0, y + TILE);
  grad.addColorStop(0, th.body[0]);
  grad.addColorStop(1, th.body[1]);
  roundedRect(ctx, x, y, TILE, h, corners);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.clip();
  for (let k = 0; k < 7; k++) {
    ctx.fillStyle = k % 2 ? th.speck : 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    ctx.arc(x + hash(c, r, k) * TILE, y + hash(c, r, k + 11) * h, 2 + hash(c, r, k + 23) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!lf) {
    ctx.fillStyle = shadeBand(ctx, x, 0, x + 10, 0);
    ctx.fillRect(x, y, 10, h);
  }
  if (!rt) {
    ctx.fillStyle = shadeBand(ctx, x + TILE, 0, x + TILE - 10, 0);
    ctx.fillRect(x + TILE - 10, y, 10, h);
  }
  if (!dn) {
    ctx.fillStyle = shadeBand(ctx, 0, y + h, 0, y + h - 12);
    ctx.fillRect(x, y + h - 12, TILE, 12);
  }
  ctx.restore();

  if (!up) drawTopTrim(ctx, x, y, c, r, !lf, !rt, trimTheme, th);
}

function drawTopTrim(ctx, x, y, c, r, openL, openR, theme, th) {
  const g = ctx.createLinearGradient(0, y - 4, 0, y + 16);
  g.addColorStop(0, th.top[0]);
  g.addColorStop(1, th.top[1]);
  ctx.fillStyle = g;
  roundedRect(ctx, x - (openL ? 2 : 0), y - 4, TILE + (openL ? 2 : 0) + (openR ? 2 : 0), 18, [openL ? 9 : 0, openR ? 9 : 0, openR ? 9 : 0, openL ? 9 : 0]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x + (openL ? 6 : 0), y - 2, TILE - (openL ? 6 : 0) - (openR ? 6 : 0), 3);

  if (theme === 'meadow' || theme === 'woods') {
    ctx.fillStyle = th.top[theme === 'meadow' ? 0 : 1];
    for (let k = 0; k < 4; k++) {
      const tx = x + 6 + hash(c, r, k + 40) * (TILE - 12);
      const hgt = 5 + hash(c, r, k + 50) * 7;
      ctx.beginPath();
      if (theme === 'meadow') {
        ctx.moveTo(tx - 4, y - 2);
        ctx.quadraticCurveTo(tx, y - 2 - hgt * 2, tx + 4, y - 2);
      } else {
        ctx.ellipse(tx, y + 13, 3, hgt * 0.8, 0, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    if (theme === 'meadow' && hash(c, r, 77) > 0.72) {
      const fx = x + 10 + hash(c, r, 78) * (TILE - 20);
      ctx.fillStyle = hash(c, r, 79) > 0.5 ? '#ffffff' : '#ffd0e4';
      for (let p = 0; p < 5; p++) {
        ctx.beginPath();
        ctx.arc(fx + Math.cos(p * 1.256) * 3.5, y - 7 + Math.sin(p * 1.256) * 3.5, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath();
      ctx.arc(fx, y - 7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'works' || theme === 'belt') {
    ctx.fillStyle = 'rgba(40,48,64,0.55)';
    for (const rx of [x + 10, x + TILE - 10]) {
      ctx.beginPath();
      ctx.arc(rx, y + 5, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'peaks' && hash(c, r, 90) > 0.6) {
    const cx0 = x + 12 + hash(c, r, 91) * (TILE - 24);
    const h = 10 + hash(c, r, 92) * 12;
    ctx.fillStyle = hash(c, r, 93) > 0.5 ? '#bfe9ff' : '#ffd1ec';
    ctx.beginPath();
    ctx.moveTo(cx0 - 5, y);
    ctx.lineTo(cx0, y - h);
    ctx.lineTo(cx0 + 5, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(cx0 - 1, y - 2);
    ctx.lineTo(cx0, y - h + 3);
    ctx.lineTo(cx0 + 2, y - 2);
    ctx.fill();
  }
}

function drawPlank(ctx, x, y, th, openL, openR) {
  const g = ctx.createLinearGradient(0, y, 0, y + ONEWAY_H);
  g.addColorStop(0, th.plank[0]);
  g.addColorStop(1, th.plank[1]);
  ctx.fillStyle = g;
  roundedRect(ctx, x + (openL ? 2 : 0), y, TILE - (openL ? 2 : 0) - (openR ? 2 : 0), ONEWAY_H, [openL ? 7 : 0, openR ? 7 : 0, openR ? 7 : 0, openL ? 7 : 0]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + (openL ? 6 : 0), y + 2, TILE - (openL ? 6 : 0) - (openR ? 6 : 0), 3);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x + TILE / 2 - 1, y + 5, 2, ONEWAY_H - 7);
}

function drawSpikes(ctx, x, y, theme) {
  const base = y + TILE;
  ctx.fillStyle = '#4a2b3a';
  roundedRect(ctx, x + 1, base - 8, TILE - 2, 8, [3, 3, 0, 0]);
  ctx.fill();
  ctx.lineJoin = 'round';
  for (let k = 0; k < 4; k++) {
    const sx = x + 2 + k * 15;
    const g = ctx.createLinearGradient(sx, base - SPIKE_H - 6, sx + 15, base);
    g.addColorStop(0, theme === 'peaks' ? '#ffffff' : '#ffffff');
    g.addColorStop(1, theme === 'peaks' ? '#7fb2e0' : '#9aa3b5');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#4a2b3a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx, base - 6);
    ctx.lineTo(sx + 7.5, base - SPIKE_H - 6);
    ctx.lineTo(sx + 15, base - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawPad(ctx, x, y) {
  const top = y + TILE - PAD_H;
  ctx.fillStyle = '#f3e3cf';
  roundedRect(ctx, x + 18, top + 8, TILE - 36, PAD_H - 8, [0, 0, 4, 4]);
  ctx.fill();
  const g = ctx.createLinearGradient(0, top, 0, top + 14);
  g.addColorStop(0, '#ff8fb3');
  g.addColorStop(1, '#e0527f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x + TILE / 2, top + 11, TILE / 2 - 4, 11, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const dx of [-12, 4, 16]) {
    ctx.beginPath();
    ctx.arc(x + TILE / 2 + dx, top + 4 + Math.abs(dx) / 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  return Object.assign(document.createElement('canvas'), { width: w, height: h });
}

// Returns { canvas, conveyors: [{x, y, dir}] } for the static tiles of a level.
export const GROUND_EXT = 640;

export function bakeTiles(st, themeName, theme) {
  const canvas = makeCanvas(st.W, st.H + GROUND_EXT);
  const ctx = canvas.getContext('2d');
  // Solid earth continues below the bottom row so land never looks like it floats.
  for (let c = 0; c < st.cols; c++) {
    if (!solidAt(st, c, st.rows - 1)) continue;
    const g = ctx.createLinearGradient(0, st.H, 0, st.H + GROUND_EXT);
    g.addColorStop(0, theme.body[1]);
    g.addColorStop(1, theme.edge);
    ctx.fillStyle = g;
    ctx.fillRect(c * TILE, st.H, TILE, GROUND_EXT);
  }
  const conveyors = [];
  const belt = { ...theme, body: ['#5b6272', '#3b404d'], top: ['#6b7384', '#474d5c'] };
  for (let r = 0; r < st.rows; r++) {
    for (let c = 0; c < st.cols; c++) {
      const code = st.tiles[r * st.cols + c];
      const x = c * TILE;
      const y = r * TILE;
      if (code === T.SOLID) drawSolid(ctx, st, c, r, theme, themeName);
      else if (code === T.CONV_R || code === T.CONV_L) {
        conveyors.push({ x, y, dir: code === T.CONV_R ? 1 : -1 });
        drawSolid(ctx, st, c, r, belt, 'belt');
      } else if (code === T.ONEWAY) {
        const same = (cc) => cc >= 0 && cc < st.cols && st.tiles[r * st.cols + cc] === T.ONEWAY;
        drawPlank(ctx, x, y, theme, !same(c - 1), !same(c + 1));
      } else if (code === T.SPIKES) drawSpikes(ctx, x, y, themeName);
      else if (code === T.LOW) drawSolid(ctx, st, c, r, theme, themeName, true);
      else if (code === T.PAD) drawPad(ctx, x, y);
    }
  }
  return { canvas, conveyors };
}
