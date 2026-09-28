// Draws a session: backdrop, baked tiles, objects, blobs, particles, HUD.
// Everything is drawn in a virtual 1920x1080 space, letterboxed to the window.
import { cameraTarget } from '../sim/camera.js';
import { COLORS } from '../sim/constants.js';
import { THEMES, THEME_OF_WORLD } from './themes.js';
import { bakeTiles, roundedRect } from './tiles.js';
import { drawBackdrop } from './backdrops.js';
import { drawBlob, makeBlobAnim, updateBlobAnim, glyphPath } from './blobs.js';
import {
  drawConveyors, drawPlate, drawGate, drawColorGate, drawLift, drawCrate, drawKey, drawDoor, drawCheckpoint, drawPaint, drawTether,
} from './entities.js';
import { createParticles } from './particles.js';

const VW = 1920;
const VH = 1080;

const lerp = (a, b, t) => a + (b - a) * t;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const particles = createParticles();
  let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
  let level = null;
  let cam = { x: VW / 2, y: VH / 2, zoom: 1 };
  let shake = 0;
  let flash = 0;
  let anims = [];
  let settings = { reducedMotion: false, glyphs: true };
  let vignette = null;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const scale = Math.min(w / VW, h / VH);
    view = { scale, ox: (w - VW * scale) / 2, oy: (h - VH * scale) / 2, dpr };
  }

  function buildVignette() {
    const c = document.createElement('canvas');
    c.width = VW;
    c.height = VH;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VH * 1.05);
    rg.addColorStop(0, 'rgba(40,20,50,0)');
    rg.addColorStop(1, 'rgba(40,20,50,0.35)');
    g.fillStyle = rg;
    g.fillRect(0, 0, VW, VH);
    return c;
  }

  function setLevel(def, state) {
    const themeName = THEME_OF_WORLD[def.world] ?? 'meadow';
    const theme = THEMES[themeName];
    const { canvas: tiles, conveyors } = bakeTiles(state.static, themeName, theme);
    level = { def, themeName, theme, tiles, conveyors };
    anims = state.blobs.map(() => makeBlobAnim());
    cam = { ...cameraTarget(state) };
    shake = 0;
    flash = 0;
  }

  function setSettings(s) {
    settings = { ...settings, ...s };
    particles.setReduced(!!settings.reducedMotion);
  }

  // React to simulation events with particles, squash and shake.
  function onEvents(state, events) {
    for (const e of events) {
      const b = e.i !== undefined && e.kind !== 'crate' ? state.blobs[e.i] : null;
      switch (e.type) {
        case 'jump':
          if (b) particles.dust(b.x + b.w / 2, b.y + b.h, 5);
          break;
        case 'land':
          if (b && anims[b.i]) anims[b.i].squashT = Math.min(1, e.v / 1200);
          particles.dust(e.x, e.y, 8);
          if (e.kind === 'crate') shake = Math.max(shake, 6);
          break;
        case 'bounce':
        case 'pad':
          particles.sparkle(e.x, e.y, 12, '#ffffff');
          break;
        case 'die':
          particles.puff(e.x, e.y, COLORS[e.color] ?? '#ffffff', 22);
          shake = Math.max(shake, 12);
          break;
        case 'respawn':
          particles.sparkle(e.x, e.y, 10, '#ffffff');
          break;
        case 'key':
        case 'checkpoint':
          particles.sparkle(e.x, e.y, 16);
          break;
        case 'unlock':
          particles.sparkle(e.x, e.y, 30);
          flash = 0.35;
          break;
        case 'enter':
          particles.sparkle(e.x, e.y - 24, 12, COLORS[state.blobs[e.i].color]);
          break;
        case 'paint':
          particles.puff(e.x, e.y, COLORS[e.color], 12);
          break;
        case 'crateReset':
          particles.puff(e.x, e.y, '#f7c98b', 16);
          break;
        case 'clear':
          particles.confetti(state.door.x + state.door.w / 2, state.door.y);
          break;
        default:
          break;
      }
    }
  }

  function pill(x, y, w, h, color) {
    ctx.fillStyle = color;
    roundedRect(ctx, x, y, w, h, [h / 2, h / 2, h / 2, h / 2]);
    ctx.fill();
  }

  function drawHud(session, t) {
    const s = session.state;
    ctx.textBaseline = 'middle';
    ctx.font = '600 30px "Baloo 2", system-ui, sans-serif';
    const secs = session.ticks / 60;
    const label = level.def.name;
    const time = `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
    const w1 = ctx.measureText(label).width + 150;
    pill(28, 24, w1, 56, 'rgba(40,25,55,0.55)');
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(label, 52, 53);
    ctx.fillStyle = '#ffe58a';
    ctx.textAlign = 'right';
    ctx.fillText(time, 28 + w1 - 22, 53);

    pill(VW - 110, 24, 82, 56, 'rgba(40,25,55,0.55)');
    ctx.save();
    ctx.globalAlpha = s.key.holder === -1 ? 0.35 : 1;
    drawKey(ctx, { x: VW - 69, y: 52, holder: 0 }, t);
    ctx.restore();
    if (s.door.open) {
      ctx.fillStyle = '#7fe08a';
      ctx.beginPath();
      ctx.arc(VW - 44, 66, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (s.solo) {
      s.blobs.forEach((b, k) => {
        const x = 40 + k * 86;
        const y = VH - 70;
        const active = s.solo.active === b.i;
        ctx.fillStyle = active ? 'rgba(255,255,255,0.92)' : 'rgba(40,25,55,0.5)';
        roundedRect(ctx, x, y - 34, 72, 68, [20, 20, 20, 20]);
        ctx.fill();
        ctx.fillStyle = COLORS[b.color];
        ctx.beginPath();
        ctx.ellipse(x + 36, y + 2, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2b1d33';
        for (const dx of [-7, 7]) {
          ctx.beginPath();
          ctx.arc(x + 36 + dx, y - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = active ? '#2b1d33' : '#ffffff';
        ctx.font = '700 18px "Baloo 2", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(String(k + 1), x + 8, y - 20);
        if (b.inDoor || !b.alive) {
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          roundedRect(ctx, x, y - 34, 72, 68, [20, 20, 20, 20]);
          ctx.fill();
        }
      });
      const fx = 40 + s.blobs.length * 86 + 10;
      pill(fx, VH - 104, 190, 68, s.solo.follow ? '#7fe08a' : 'rgba(40,25,55,0.5)');
      ctx.fillStyle = s.solo.follow ? '#1f3d22' : '#ffffff';
      ctx.font = '700 24px "Baloo 2", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.solo.follow ? 'Follow: ON' : 'Follow: OFF', fx + 95, VH - 70);
      ctx.font = '600 22px "Baloo 2", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(40,25,55,0.55)';
      ctx.lineWidth = 5;
      const tip = 'Q / E  switch mochi   ·   F  follow';
      ctx.strokeText(tip, fx + 206, VH - 70);
      ctx.fillText(tip, fx + 206, VH - 70);
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawEmote(bx, by, em, color) {
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, bx - 26, by - 26, 52, 40, [16, 16, 16, 16]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + 13);
    ctx.lineTo(bx, by + 22);
    ctx.lineTo(bx + 6, by + 13);
    ctx.fill();
    ctx.fillStyle = color;
    if (em.id === 0) {
      glyphPath(ctx, 'heart', bx, by - 6, 11);
      ctx.fill();
    } else {
      ctx.font = '800 30px "Baloo 2", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(em.id === 1 ? '!' : em.id === 2 ? '?' : '♪', bx, by + 5);
    }
  }

  // session: { state, prev, ticks, emotes }. alpha: interpolation. dt: seconds since last draw.
  function draw(session, alpha, dt, t) {
    if (!level) return;
    const s = session.state;
    const prev = session.prev;
    const reduced = settings.reducedMotion;

    const target = cameraTarget(s);
    const k = 1 - Math.exp(-dt / 0.15);
    cam.x = lerp(cam.x, target.x, k);
    cam.y = lerp(cam.y, target.y, k);
    cam.zoom = lerp(cam.zoom, target.zoom, k);
    shake = Math.max(0, shake - dt * 40);
    flash = Math.max(0, flash - dt);
    particles.update(dt);
    s.blobs.forEach((b, i) => updateBlobAnim(anims[i], b, dt));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1b1224';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const px = view.dpr * view.scale;
    ctx.setTransform(px, 0, 0, px, view.ox * view.dpr, view.oy * view.dpr);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    drawBackdrop(ctx, level.themeName, level.theme, cam, reduced ? 0 : t);

    ctx.save();
    const sx = reduced ? 0 : (Math.random() - 0.5) * shake;
    const sy = reduced ? 0 : (Math.random() - 0.5) * shake;
    ctx.translate(VW / 2 + sx, VH / 2 + sy);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    ctx.drawImage(level.tiles, 0, 0);
    drawConveyors(ctx, level.conveyors, t);
    for (const p of s.paints) drawPaint(ctx, p, t);
    for (const cp of s.checkpoints) drawCheckpoint(ctx, cp, t);
    drawDoor(ctx, s.door, s.blobs, t);
    for (const p of s.plates) drawPlate(ctx, p);
    for (const g of s.gates) drawGate(ctx, g, level.themeName);
    s.lifts.forEach((l, i) => {
      const p0 = prev?.lifts[i] ?? l;
      drawLift(ctx, l, lerp(p0.x, l.x, alpha), lerp(p0.y, l.y, alpha), level.themeName);
    });
    s.crates.forEach((c, i) => {
      const p0 = prev?.crates[i] ?? c;
      drawCrate(ctx, c, lerp(p0.x, c.x, alpha), lerp(p0.y, c.y, alpha));
    });

    const pos = s.blobs.map((b, i) => {
      const p0 = prev?.blobs[i] ?? b;
      const far = Math.abs(p0.x - b.x) > 200 || Math.abs(p0.y - b.y) > 200; // respawn: no smear
      return far ? { x: b.x, y: b.y } : { x: lerp(p0.x, b.x, alpha), y: lerp(p0.y, b.y, alpha) };
    });
    if (s.tether) {
      const pts = [];
      s.blobs.forEach((b, i) => {
        if (b.alive && !b.inDoor) pts.push({ x: pos[i].x + b.w / 2, y: pos[i].y + b.h / 2 });
      });
      drawTether(ctx, pts, s.tether.len);
    }
    s.blobs.forEach((b, i) => {
      if (!b.alive || b.inDoor) return;
      drawBlob(ctx, b, pos[i].x, pos[i].y, anims[i], t, { active: !!s.solo && s.solo.active === i, glyphs: settings.glyphs });
    });
    for (const g of s.cgates) drawColorGate(ctx, g, t);
    drawKey(ctx, s.key, t);
    particles.draw(ctx);
    for (const em of session.emotes ?? []) {
      const b = s.blobs[em.i];
      if (b && b.alive && !b.inDoor) drawEmote(pos[em.i].x + b.w / 2, pos[em.i].y - 40, em, COLORS[b.color]);
    }
    ctx.restore();

    if (!vignette) vignette = buildVignette();
    ctx.drawImage(vignette, 0, 0);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,248,220,${flash})`;
      ctx.fillRect(0, 0, VW, VH);
    }
    if (!session.hideHud) drawHud(session, t);
    ctx.restore();
  }

  resize();
  window.addEventListener('resize', resize);
  return { setLevel, setSettings, onEvents, draw, resize };
}
