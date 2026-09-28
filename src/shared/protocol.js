// Message parsing and validation shared by the client and the server.
// Every client message is checked here before the server acts on it.
export const MAX_MSG = 4096;
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-HJ-NP-Z2-9]{4}$/;
const TOKEN_RE = /^[a-f0-9]{32}$/;
// Control characters are not allowed in names.
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

export function parse(raw) {
  const text = typeof raw === 'string' ? raw : String(raw);
  if (text.length > MAX_MSG) return { ok: false, err: 'too_big' };
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return { ok: false, err: 'bad_json' };
  }
  if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.type !== 'string') return { ok: false, err: 'bad_shape' };
  return { ok: true, msg };
}

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

function cleanName(name) {
  if (typeof name !== 'string') return null;
  const n = name.trim();
  if (n.length < 1 || n.length > 16 || CONTROL_RE.test(n)) return null;
  return n;
}

// levels: Set of valid level ids. Returns { ok: true, msg } (normalized) or { ok: false, err }.
export function validateClient(msg, levels) {
  const bad = (err) => ({ ok: false, err });
  switch (msg.type) {
    case 'create': {
      const name = cleanName(msg.name);
      return name ? { ok: true, msg: { type: 'create', name } } : bad('bad_name');
    }
    case 'join': {
      const name = cleanName(msg.name);
      if (!name) return bad('bad_name');
      if (typeof msg.code !== 'string' || !CODE_RE.test(msg.code)) return bad('bad_code');
      return { ok: true, msg: { type: 'join', code: msg.code, name } };
    }
    case 'rejoin':
      return typeof msg.token === 'string' && TOKEN_RE.test(msg.token) ? { ok: true, msg: { type: 'rejoin', token: msg.token } } : bad('bad_token');
    case 'ready':
      return typeof msg.on === 'boolean' ? { ok: true, msg: { type: 'ready', on: msg.on } } : bad('bad_ready');
    case 'pick':
      return typeof msg.level === 'string' && levels.has(msg.level) ? { ok: true, msg: { type: 'pick', level: msg.level } } : bad('bad_level');
    case 'input': {
      const list = msg.inputs;
      if (!Array.isArray(list) || list.length < 1 || list.length > 3) return bad('bad_input');
      for (const pair of list) {
        if (!Array.isArray(pair) || pair.length !== 2 || !isInt(pair[0], 0, 2 ** 31) || !isInt(pair[1], 0, 31)) return bad('bad_input');
      }
      return { ok: true, msg: { type: 'input', inputs: list.map(([s, b]) => [s, b]) } };
    }
    case 'emote':
      return isInt(msg.id, 0, 3) ? { ok: true, msg: { type: 'emote', id: msg.id } } : bad('bad_emote');
    case 'ping':
      return typeof msg.t === 'number' && Number.isFinite(msg.t) ? { ok: true, msg: { type: 'ping', t: msg.t } } : bad('bad_ping');
    case 'start':
    case 'restart':
    case 'quit':
    case 'leave':
      return { ok: true, msg: { type: msg.type } };
    default:
      return bad('unknown_type');
  }
}
