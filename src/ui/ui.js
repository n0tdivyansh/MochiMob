// Screen manager for the HTML menus drawn over the canvas.
// Keyboard and gamepad move focus spatially between [data-nav] elements.
import './ui.css';

export function createUI(root, { sfx = () => {} } = {}) {
  let onBack = null;
  let toastTimer = 0;

  const focusables = () => [...root.querySelectorAll('[data-nav]')].filter((el) => !el.disabled && el.offsetParent !== null);
  const focused = () => root.querySelector('.is-focus');

  function focus(el) {
    focused()?.classList.remove('is-focus');
    if (!el) return;
    el.classList.add('is-focus');
    el.scrollIntoView({ block: 'nearest' });
  }

  function show(html, opts = {}) {
    onBack = opts.onBack ?? null;
    root.classList.toggle('dim', !!opts.dim);
    root.innerHTML = `<div class="screen">${html}</div>`;
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('mouseenter', () => focus(el));
      if (el.tagName === 'BUTTON') el.addEventListener('click', () => sfx('ok'));
    });
    if (opts.bind) opts.bind(root.firstElementChild);
    focus((opts.focus && root.querySelector(opts.focus)) || focusables()[0]);
  }

  function hide() {
    onBack = null;
    root.classList.remove('dim');
    root.innerHTML = '';
  }

  function move(dir) {
    const list = focusables();
    const cur = focused();
    if (!cur) return focus(list[0]);
    if (cur.type === 'range' && (dir === 'left' || dir === 'right')) {
      cur.value = Number(cur.value) + (dir === 'left' ? -1 : 1) * Number(cur.step || 1);
      cur.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const a = cur.getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    let best = null;
    let bestScore = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      const b = el.getBoundingClientRect();
      const vx = b.left + b.width / 2 - ax;
      const vy = b.top + b.height / 2 - ay;
      const along = vx * dx + vy * dy;
      if (along <= 4) continue;
      const score = along + (Math.abs(vx * dy) + Math.abs(vy * dx)) * 2.5;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    if (best) {
      sfx('ui');
      focus(best);
    }
  }

  function nav(action) {
    if (!root.firstElementChild) return false;
    if (action === 'back') {
      if (onBack) {
        sfx('back');
        onBack();
      }
      return true;
    }
    if (action === 'ok') {
      const el = focused();
      if (el && !el.disabled) el.click();
      return true;
    }
    if (['up', 'down', 'left', 'right'].includes(action)) move(action);
    return true;
  }

  function toast(msg, ms = 2600) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  return {
    show,
    hide,
    nav,
    toast,
    get open() {
      return !!root.firstElementChild;
    },
  };
}

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ENTITIES[c]);
