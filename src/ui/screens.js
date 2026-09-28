// Menu screens. Each function renders one screen through app.ui.show().
import { esc } from './ui.js';
import { COLORS, COLOR_NAMES } from '../sim/constants.js';
import { ACTIONS, ACTION_LABELS, keyLabel, rebind } from '../input/bindings.js';

const fmt = (ticks) => {
  const s = ticks / 60;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
};
const starRow = (n, max = 3) => '★'.repeat(n) + `<span class="off">${'★'.repeat(max - n)}</span>`;
const logo = () =>
  `<h1 class="logo">${[...'Mochi Mob'].map((c, i) => (c === ' ' ? ' ' : `<span style="animation-delay:${i * 0.08}s">${c}</span>`)).join('')}</h1>`;

export function createScreens(app) {
  const { ui } = app;
  const mode = () => (app.mode === 'solo' ? 'solo' : 'coop');
  const on = (el, sel, fn) => el.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => fn(b)));

  const screens = {
    title() {
      app.screen = 'title';
      app.audio.play('title');
      ui.show(
        `${logo()}
        <p class="tagline">A squishy co-op puzzle platformer</p>
        <div class="menu">
          <button class="btn primary" data-nav data-go="solo">Solo</button>
          <button class="btn" data-nav data-go="local">Local Co-op</button>
          <button class="btn" data-nav data-go="online">Online</button>
          <button class="btn" data-nav data-go="settings">Settings</button>
          <button class="btn" data-nav data-go="credits">Credits</button>
        </div>
        <p class="hint">Arrows + Enter, or a gamepad</p>`,
        {
          bind: (el) =>
            on(el, '[data-go]', (b) => {
              const go = b.dataset.go;
              if (go === 'solo') screens.soloSetup();
              else if (go === 'local') screens.localSetup();
              else if (go === 'online') screens.online();
              else if (go === 'settings') screens.settings(() => screens.title());
              else screens.credits();
            }),
        },
      );
    },

    soloSetup() {
      app.screen = 'soloSetup';
      const n = app.soloSize ?? 2;
      ui.show(
        `<div class="card">
          <h2>Solo</h2>
          <p class="muted">${n === 1 ? `Just you: <strong>Solo Trials</strong> are ${app.trials.length} levels built for a single mochi.` : 'Lead a whole team of mochi yourself through the co-op levels. Switch between them, or have the others follow you.'}</p>
          <div class="row" style="margin:14px 0">
            <strong style="font-size:22px">Team size</strong>
            ${[1, 2, 3, 4].map((k) => `<button class="choice ${k === n ? 'on' : ''}" data-nav data-n="${k}">${k}</button>`).join('')}
          </div>
          <div class="keys">
            <span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd></span><span>Move</span>
            <span><kbd>W</kbd> / <kbd>↑</kbd></span><span>Jump, or enter an open door</span>
            <span><kbd>S</kbd> / <kbd>↓</kbd></span><span>Squish & crawl (friends bounce off you)</span>
            <span><kbd>Q</kbd> <kbd>E</kbd> / <kbd>1</kbd>-<kbd>4</kbd></span><span>Switch mochi</span>
            <span><kbd>F</kbd></span><span>Follow me on / off</span>
            <span><kbd>Esc</kbd></span><span>Pause</span>
          </div>
          <div class="row"><button class="btn small" data-nav data-back>Back</button><button class="btn primary small" data-nav data-go>Choose level</button></div>
        </div>`,
        {
          onBack: () => screens.title(),
          focus: '[data-go]',
          bind: (el) => {
            on(el, '[data-n]', (b) => {
              app.soloSize = Number(b.dataset.n);
              screens.soloSetup();
            });
            on(el, '[data-back]', () => screens.title());
            on(el, '[data-go]', () => {
              app.setMode('solo', app.soloSize ?? 2);
              screens.map();
            });
          },
        },
      );
    },

    localSetup() {
      app.screen = 'localSetup';
      app.joined = app.joined ?? [];
      const slots = [0, 1, 2, 3]
        .map((i) => {
          const d = app.joined[i];
          if (!d) return `<div class="slot empty">Press <strong>Jump</strong><br/>to join</div>`;
          const b = app.input.bindings[d.slot ?? 0];
          const label = d.kind === 'kb' ? `Keys ${keyLabel(b.left)} ${keyLabel(b.jump)} ${keyLabel(b.right)} ${keyLabel(b.squish)}` : `Gamepad ${d.index + 1}`;
          return `<div class="slot"><div class="blob" style="background:${COLORS[i]}"></div><div>${COLOR_NAMES[i]}</div><div class="muted">${esc(label)}</div></div>`;
        })
        .join('');
      ui.show(
        `<div class="card">
          <h2>Local Co-op</h2>
          <p class="muted">Each player presses their <strong>Jump</strong> key (W, ↑, I or Num8) or gamepad <strong>A</strong> to join, and <strong>Squish</strong> to leave. 2 to 4 players.</p>
          <div class="slots">${slots}</div>
          <div class="row"><button class="btn small" data-nav data-back>Back</button><button class="btn primary small" data-nav data-go ${app.joined.length < 2 ? 'disabled' : ''}>Choose level</button></div>
          <p class="muted" style="text-align:center;margin-top:10px">Gamepads: press Start to continue.</p>
        </div>`,
        {
          onBack: () => {
            app.joined = [];
            screens.title();
          },
          focus: app.joined.length >= 2 ? '[data-go]' : '[data-back]',
          bind: (el) => {
            on(el, '[data-back]', () => {
              app.joined = [];
              screens.title();
            });
            on(el, '[data-go]', () => screens.startLocal());
          },
        },
      );
    },

    startLocal() {
      if ((app.joined ?? []).length < 2) return;
      app.setMode('local', app.joined.length, app.joined.slice());
      screens.map();
    },

    map() {
      app.screen = 'map';
      app.audio.play('title');
      // A team of one plays the Solo Trials; teams of 2-4 play the co-op worlds.
      const trials = app.mode === 'solo' && app.n === 1;
      const worlds = trials ? [app.trialWorld] : app.worlds;
      if (!worlds.some((w) => w.id === app.world)) app.world = worlds[0].id;
      const world = app.world;
      const levels = app.levels.filter((l) => l.world === world);
      const worldOpen = (w) => app.save.isUnlocked(app.levels.find((l) => l.world === w).id);
      const who = app.mode === 'solo' ? (trials ? 'Solo · just you' : `Solo · team of ${app.n}`) : `Co-op · ${app.n} players`;
      ui.show(
        `<div class="card">
          <div class="spread"><h2>${esc(worlds.find((w) => w.id === world).name)}</h2><span class="muted" style="font-weight:700">${who}</span></div>
          <div class="worlds">${worlds
            .map((w) => `<button class="btn small ${w.id === world ? 'primary' : ''}" data-nav data-world="${w.id}" ${worldOpen(w.id) ? '' : 'disabled'}>${trials ? "" : `${w.id}. `}${esc(w.name)}</button>`)
            .join('')}</div>
          <div class="levels">${levels
            .map((l, k) => {
              const open = app.save.isUnlocked(l.id);
              const best = app.save.bestFor(mode(), l.id);
              return `<button class="level ${open ? '' : 'locked'}" data-nav data-level="${l.id}" ${open ? '' : 'disabled'}>
                <span class="num">${open ? (trials ? `T${k + 1}` : `${world}-${k + 1}`) : "🔒"}</span>
                <span class="name">${esc(l.name)}</span>
                <span class="stars">${open ? starRow(app.save.starsFor(mode(), l.id)) : ''}</span>
                <span class="best">${best ? fmt(best) : '&nbsp;'}</span>
              </button>`;
            })
            .join('')}</div>
          <div class="row" style="margin-top:18px"><button class="btn small" data-nav data-back>Back</button></div>
        </div>`,
        {
          onBack: () => (app.mode === 'solo' ? screens.soloSetup() : screens.localSetup()),
          focus: app.lastLevel ? `[data-level="${app.lastLevel}"]:not([disabled])` : '[data-level]:not([disabled])',
          bind: (el) => {
            on(el, '[data-world]', (b) => {
              app.world = Number(b.dataset.world);
              app.lastLevel = null;
              screens.map();
            });
            on(el, '[data-level]', (b) => app.startLevel(b.dataset.level));
            on(el, '[data-back]', () => (app.mode === 'solo' ? screens.soloSetup() : screens.localSetup()));
          },
        },
      );
    },

    pause() {
      app.screen = 'pause';
      const hint = app.session?.def.hint;
      ui.show(
        `<div class="card" style="max-width:520px;margin:auto">
          <h2 style="text-align:center">Paused</h2>
          ${hint ? `<p class="muted" style="text-align:center">Hint: ${esc(hint)}</p>` : ''}
          <div class="menu">
            <button class="btn primary" data-nav data-a="resume">Resume</button>
            <button class="btn" data-nav data-a="restart">Restart level</button>
            <button class="btn" data-nav data-a="settings">Settings</button>
            <button class="btn" data-nav data-a="quit">Quit to map</button>
          </div>
        </div>`,
        {
          dim: true,
          onBack: () => app.resume(),
          bind: (el) =>
            on(el, '[data-a]', (b) => {
              const a = b.dataset.a;
              if (a === 'resume') app.resume();
              else if (a === 'restart') app.restart();
              else if (a === 'settings') screens.settings(() => screens.pause(), true);
              else app.quitToMap();
            }),
        },
      );
    },

    // One-time explainer shown before the first solo level.
    soloTip() {
      app.screen = 'soloTip';
      const done = () => {
        app.save.saveSettings({ soloTipSeen: true });
        app.resume();
      };
      ui.show(
        `<div class="card" style="max-width:640px;margin:auto">
          <h2 style="text-align:center">You lead the whole team!</h2>
          <p style="font-size:20px;text-align:center">Every level needs teamwork, so in solo you control <strong>all</strong> the mochi, one at a time. The arrow shows who you are moving.</p>
          <div class="keys">
            <span><kbd>Q</kbd> <kbd>E</kbd> / <kbd>1</kbd>-<kbd>4</kbd></span><span>Switch to another mochi</span>
            <span><kbd>F</kbd></span><span>The others follow you</span>
            <span><kbd>S</kbd> / <kbd>↓</kbd></span><span>Squish: a squished mochi stays squished while you switch away</span>
          </div>
          <p class="muted" style="text-align:center">Everyone has to reach the door to finish a level.</p>
          <div class="row"><button class="btn primary" data-nav data-ok>Got it!</button></div>
        </div>`,
        { dim: true, onBack: done, bind: (el) => on(el, '[data-ok]', done) },
      );
    },

    results({ ticks, stars, newBest, nextId }) {
      app.screen = 'results';
      const def = app.session.def;
      ui.show(
        `<div class="card" style="max-width:560px;margin:auto">
          <h2 style="text-align:center">Level clear!</h2>
          <div class="stars-big">${starRow(stars)}</div>
          <p class="stat">${fmt(ticks)}${newBest ? ' · <span style="color:#e0487a">New best!</span>' : ''}</p>
          <p class="muted" style="text-align:center">★★ under ${def.par}s · ★★★ under ${def.gold}s</p>
          <div class="menu">
            ${nextId ? '<button class="btn primary" data-nav data-a="next">Next level</button>' : ''}
            <button class="btn" data-nav data-a="retry">Retry</button>
            <button class="btn" data-nav data-a="map">Level map</button>
          </div>
        </div>`,
        {
          dim: true,
          onBack: () => app.quitToMap(),
          bind: (el) =>
            on(el, '[data-a]', (b) => {
              const a = b.dataset.a;
              if (a === 'next') app.startLevel(nextId);
              else if (a === 'retry') app.restart();
              else app.quitToMap();
            }),
        },
      );
    },

    settings(back, dim = false) {
      app.screen = 'settings';
      const s = app.save.settings;
      const slider = (key, label) =>
        `<label class="setting"><span>${label}</span><input type="range" min="0" max="10" step="1" value="${Math.round(s[key] * 10)}" data-nav data-vol="${key}"/><span data-show="${key}">${Math.round(s[key] * 100)}%</span></label>`;
      ui.show(
        `<div class="card">
          <h2>Settings</h2>
          ${slider('master', 'Master volume')}
          ${slider('music', 'Music')}
          ${slider('sfx', 'Sound effects')}
          <label class="toggle"><input type="checkbox" data-nav data-flag="reducedMotion" ${s.reducedMotion ? 'checked' : ''}/> Reduced motion (no shake, fewer particles)</label>
          <label class="toggle"><input type="checkbox" data-nav data-flag="glyphs" ${s.glyphs ? 'checked' : ''}/> Show colour symbols on mochi</label>
          <div class="row" style="justify-content:flex-start;margin:8px 0 4px"><button class="btn small" data-nav data-fs>Toggle fullscreen</button><button class="btn small" data-nav data-reset>Reset keys</button></div>
          <table class="bindings">
            <tr><th></th>${ACTIONS.map((a) => `<th>${ACTION_LABELS[a]}</th>`).join('')}</tr>
            ${app.input.bindings
              .map((b, slot) => `<tr><th style="color:${COLORS[slot]}">P${slot + 1}</th>${ACTIONS.map((a) => `<td><button data-nav data-bind="${slot}:${a}">${esc(keyLabel(b[a]))}</button></td>`).join('')}</tr>`)
              .join('')}
          </table>
          <p class="muted">Click a key, then press the new key (Esc cancels). In solo, Q/E switch mochi and F toggles follow.</p>
          <div class="row"><button class="btn primary small" data-nav data-done>Done</button></div>
        </div>`,
        {
          dim,
          onBack: back,
          focus: '[data-done]',
          bind: (el) => {
            el.querySelectorAll('[data-vol]').forEach((r) =>
              r.addEventListener('input', () => {
                const v = Number(r.value) / 10;
                app.save.saveSettings({ [r.dataset.vol]: v });
                el.querySelector(`[data-show="${r.dataset.vol}"]`).textContent = `${Math.round(v * 100)}%`;
                app.applySettings();
              }),
            );
            el.querySelectorAll('[data-flag]').forEach((c) =>
              c.addEventListener('change', () => {
                app.save.saveSettings({ [c.dataset.flag]: c.checked });
                app.applySettings();
              }),
            );
            on(el, '[data-fs]', () => {
              if (document.fullscreenElement) document.exitFullscreen?.();
              else document.documentElement.requestFullscreen?.().catch(() => ui.toast('Fullscreen is not available here'));
            });
            on(el, '[data-reset]', () => {
              app.save.saveSettings({ bindings: null });
              app.applySettings();
              screens.settings(back, dim);
            });
            on(el, '[data-bind]', (b) => {
              const [slot, action] = b.dataset.bind.split(':');
              b.classList.add('listening');
              b.textContent = '…';
              app.captureKey((code) => {
                if (code && code !== 'Escape') {
                  app.save.saveSettings({ bindings: rebind(app.input.bindings, Number(slot), action, code) });
                  app.applySettings();
                }
                screens.settings(back, dim);
              });
            });
            on(el, '[data-done]', back);
          },
        },
      );
    },

    credits() {
      app.screen = 'credits';
      ui.show(
        `<div class="card" style="max-width:640px;margin:auto">
          <h2>Credits</h2>
          <p><strong>Mochi Mob</strong> is an original game. Every character, level, sound and melody is made in code: the art is drawn procedurally on a canvas and the music is composed by a small seeded generator.</p>
          <p class="muted">Built with JavaScript, Canvas 2D and WebAudio. Font: Baloo 2 (Google Fonts, SIL Open Font License).</p>
          <div class="row"><button class="btn primary small" data-nav data-back>Back</button></div>
        </div>`,
        { onBack: () => screens.title(), bind: (el) => on(el, '[data-back]', () => screens.title()) },
      );
    },

    // Phase D replaces this with the full lobby; until then it reports availability.
    online() {
      app.screen = 'online';
      ui.show(
        `<div class="card" style="max-width:600px;margin:auto">
          <h2>Online</h2>
          <p data-status>Checking the game server…</p>
          <div class="row"><button class="btn primary small" data-nav data-back>Back</button></div>
        </div>`,
        { onBack: () => screens.title(), bind: (el) => on(el, '[data-back]', () => screens.title()) },
      );
      app.probeServer().then((ok) => {
        const el = document.querySelector('[data-status]');
        if (!el || app.screen !== 'online') return;
        if (ok && app.openLobby) app.openLobby();
        else el.textContent = 'Online unavailable: no game server is running. Solo and Local Co-op work offline.';
      });
    },
  };
  return screens;
}
