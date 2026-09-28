import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../../server/rooms.js';
import { LEVELS } from '../../src/levels/index.js';
import { createWorld } from '../../src/sim/world.js';
import coopW11 from '../solutions/coop/w1-1.js';
import { runScript } from '../../src/bot/bot.js';

let clock;
let sent;
let closed;
let mgr;
let seed;

function setup() {
  clock = 0;
  seed = 1;
  sent = new Map();
  closed = new Set();
  mgr = new RoomManager({
    now: () => clock,
    rng: () => ((seed = (seed * 16807) % 2147483647) / 2147483647),
    send: (sock, msg) => {
      if (!sent.has(sock)) sent.set(sock, []);
      sent.get(sock).push(msg);
    },
    close: (sock) => closed.add(sock),
    levels: LEVELS,
  });
}

const sock = (name) => {
  const s = { name };
  mgr.connect(s);
  return s;
};
const msg = (s, m) => mgr.message(s, JSON.stringify(m));
const last = (s, type) => [...(sent.get(s) ?? [])].reverse().find((m) => m.type === type);
const all = (s, type) => (sent.get(s) ?? []).filter((m) => m.type === type);

function lobby(n = 2) {
  const socks = [sock('a')];
  msg(socks[0], { type: 'create', name: 'Ann' });
  const code = last(socks[0], 'room').code;
  for (let k = 1; k < n; k++) {
    socks.push(sock(`p${k}`));
    msg(socks[k], { type: 'join', code, name: `P${k}` });
  }
  return { socks, code };
}

function startGame(socks) {
  socks.forEach((s) => msg(s, { type: 'ready', on: true }));
  msg(socks[0], { type: 'start' });
}

beforeEach(setup);

describe('rooms', () => {
  it('creates a room and lets a second player join', () => {
    const { socks, code } = lobby(2);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    const room = last(socks[1], 'room');
    expect(room.players.map((p) => p.name)).toEqual(['Ann', 'P1']);
    expect(room.you).toBe(1);
    expect(room.leader).toBe(0);
    expect(room.token).toMatch(/^[a-f0-9]{32}$/);
  });

  it('rejects a bad code and a full room', () => {
    const s = sock('x');
    msg(s, { type: 'join', code: 'ZZZZ', name: 'X' });
    expect(last(s, 'error').code).toBe('no_room');
    const { code } = lobby(4);
    const late = sock('late');
    msg(late, { type: 'join', code, name: 'Late' });
    expect(last(late, 'error').code).toBe('room_full');
  });

  it('only the leader can pick and start, and start needs 2+ ready players', () => {
    const { socks } = lobby(2);
    msg(socks[1], { type: 'pick', level: 'w2-3' });
    expect(last(socks[1], 'error').code).toBe('not_leader');
    msg(socks[0], { type: 'pick', level: 'w2-3' });
    expect(last(socks[1], 'room').level).toBe('w2-3');
    msg(socks[0], { type: 'start' });
    expect(last(socks[0], 'error').code).toBe('not_ready');
    startGame(socks);
    const st = last(socks[1], 'start');
    expect(st).toMatchObject({ level: 'w2-3', playerCount: 2, you: 1 });
  });

  it('applies inputs in order and acknowledges the last applied seq', () => {
    const { socks } = lobby(2);
    startGame(socks);
    msg(socks[0], { type: 'input', inputs: [[0, 2], [1, 2], [2, 2]] });
    for (let k = 0; k < 4; k++) mgr.tick();
    const snap = last(socks[0], 'snap');
    expect(snap.ack).toBe(2);
    const blob = snap.state.blobs[0];
    expect(blob.x).toBeGreaterThan(createWorld(LEVELS[0], 2).blobs[0].x);
    expect(last(socks[1], 'snap').ack).toBe(-1);
  });

  it('a co-op solution streamed through the room clears the level for everyone', () => {
    const { socks } = lobby(2);
    startGame(socks);
    // Record the inputs the bot would press, then feed them through the server.
    const track = [[], []];
    const probe = createWorld(LEVELS[0], 2);
    let prevTick = 0;
    runScript(probe, coopW11(2), {
      onTick(s) {
        for (let i = 0; i < 2; i++) track[i].push(s.blobs[i].prev);
        prevTick = s.tick;
      },
    });
    expect(probe.cleared).toBe(true);
    for (let t = 0; t < prevTick; t++) {
      for (let i = 0; i < 2; i++) msg(socks[i], { type: 'input', inputs: [[t, track[i][t]]] });
      mgr.tick();
      clock += 1000 / 60; // real time passes, so the flood guard stays quiet
    }
    for (let k = 0; k < 5; k++) mgr.tick();
    for (const s of socks) expect(all(s, 'event').some((e) => e.event.type === 'clear')).toBe(true);
    clock += 5000;
    for (let k = 0; k < 300; k++) mgr.tick();
    expect(last(socks[0], 'room').phase).toBe('lobby');
  });

  it('a disconnected player can rejoin within 30 s and keeps their slot', () => {
    const { socks } = lobby(2);
    startGame(socks);
    const token = last(socks[1], 'room').token;
    mgr.disconnect(socks[1]);
    clock += 10000;
    mgr.sweep();
    const back = sock('back');
    msg(back, { type: 'rejoin', token });
    expect(last(back, 'room').you).toBe(1);
    expect(last(back, 'start')).toBeTruthy();
  });

  it('after 30 s the slot is freed and a game with too few players returns to the lobby', () => {
    const { socks } = lobby(2);
    startGame(socks);
    const token = last(socks[1], 'room').token;
    mgr.disconnect(socks[1]);
    clock += 31000;
    mgr.sweep();
    const room = last(socks[0], 'room');
    expect(room.players.length).toBe(1);
    expect(room.phase).toBe('lobby');
    const back = sock('back');
    msg(back, { type: 'rejoin', token });
    expect(last(back, 'error').code).toBe('no_session');
  });

  it('hands leadership to the next player when the leader leaves', () => {
    const { socks } = lobby(3);
    msg(socks[0], { type: 'leave' });
    const room = last(socks[1], 'room');
    expect(room.players.map((p) => p.name)).toEqual(['P1', 'P2']);
    expect(room.leader).toBe(0);
    expect(room.you).toBe(0);
  });

  it('floods and repeated garbage disconnect only the offender', () => {
    const { socks } = lobby(2);
    for (let k = 0; k < 130; k++) msg(socks[1], { type: 'ping', t: k });
    expect(closed.has(socks[1])).toBe(true);
    expect(closed.has(socks[0])).toBe(false);
    const g = sock('garbage');
    for (let k = 0; k < 10; k++) mgr.message(g, '{nope');
    expect(closed.has(g)).toBe(true);
    msg(socks[0], { type: 'ping', t: 1 });
    expect(last(socks[0], 'pong').t).toBe(1);
  });

  it('relays emotes to the whole room', () => {
    const { socks } = lobby(2);
    startGame(socks);
    msg(socks[1], { type: 'emote', id: 2 });
    expect(last(socks[0], 'event').event).toEqual({ type: 'emote', i: 1, id: 2 });
  });
});
