// Room logic for online play. Pure: time, randomness and sockets are injected,
// so the whole lifecycle is testable without a network.
import { parse, validateClient, CODE_ALPHABET } from '../src/shared/protocol.js';
import { createWorld } from '../src/sim/world.js';
import { step } from '../src/sim/step.js';
import { encode } from '../src/sim/snapshot.js';

const MAX_PLAYERS = 4;
const GRACE_MS = 30000;
const IDLE_MS = 30 * 60 * 1000;
const RATE_LIMIT = 120; // messages per second per socket
const MAX_BAD = 10;
const SNAP_EVERY = 2; // ticks (30 Hz)
const CLEAR_HOLD = 240; // ticks before a cleared room returns to the lobby
const MAX_QUEUE = 12;

export class RoomManager {
  constructor({ now, rng, send, close, levels, maxRooms = 200 }) {
    Object.assign(this, { now, rng, send, close, maxRooms });
    this.levels = new Map(levels.map((l) => [l.id, l]));
    this.levelIds = new Set(this.levels.keys());
    this.firstLevel = levels[0].id;
    this.rooms = new Map();
    this.clients = new Map(); // sock -> { room, player, times, bad }
  }

  connect(sock) {
    this.clients.set(sock, { room: null, player: null, times: [], bad: 0 });
  }

  disconnect(sock) {
    const c = this.clients.get(sock);
    this.clients.delete(sock);
    if (!c || !c.room) return;
    const p = c.player;
    p.sock = null;
    p.goneAt = this.now();
    p.ready = false;
    const room = c.room;
    if (room.leader === room.players.indexOf(p)) this.handOff(room);
    this.broadcastRoom(room);
  }

  message(sock, raw) {
    const c = this.clients.get(sock);
    if (!c) return;
    const t = this.now();
    c.times.push(t);
    while (c.times.length && c.times[0] <= t - 1000) c.times.shift();
    if (c.times.length > RATE_LIMIT) {
      this.kick(sock, 'rate_limit');
      return;
    }
    const parsed = parse(raw);
    const valid = parsed.ok ? validateClient(parsed.msg, this.levelIds) : parsed;
    if (!valid.ok) {
      this.error(sock, 'bad_message', valid.err);
      if (++c.bad >= MAX_BAD) this.kick(sock, 'too_many_bad');
      return;
    }
    try {
      this.handle(sock, c, valid.msg);
    } catch (err) {
      this.error(sock, 'server_error', String(err && err.message));
    }
  }

  kick(sock, reason) {
    this.error(sock, 'kicked', reason);
    this.close(sock);
    this.disconnect(sock);
  }

  error(sock, code, detail = '') {
    this.send(sock, { type: 'error', code, detail });
  }

  handle(sock, c, m) {
    if (m.type === 'ping') return this.send(sock, { type: 'pong', t: m.t });
    if (m.type === 'create') return this.create(sock, c, m.name);
    if (m.type === 'join') return this.join(sock, c, m.code, m.name);
    if (m.type === 'rejoin') return this.rejoin(sock, c, m.token);
    const room = c.room;
    if (!room) return this.error(sock, 'no_room');
    room.lastActive = this.now();
    const idx = room.players.indexOf(c.player);
    const leader = idx === room.leader;
    switch (m.type) {
      case 'leave':
        return this.leave(c);
      case 'ready':
        if (room.phase !== 'lobby') return undefined;
        c.player.ready = m.on;
        return this.broadcastRoom(room);
      case 'pick':
        if (!leader) return this.error(sock, 'not_leader');
        if (room.phase !== 'lobby') return undefined;
        room.level = m.level;
        return this.broadcastRoom(room);
      case 'start': {
        if (!leader) return this.error(sock, 'not_leader');
        if (room.phase !== 'lobby') return undefined;
        const live = room.players.filter((p) => p.sock);
        if (live.length < 2 || live.length !== room.players.length || !live.every((p) => p.ready)) return this.error(sock, 'not_ready');
        return this.startGame(room);
      }
      case 'restart':
        if (!leader) return this.error(sock, 'not_leader');
        if (room.phase === 'playing') this.startGame(room);
        return undefined;
      case 'quit':
        if (!leader) return this.error(sock, 'not_leader');
        return this.toLobby(room);
      case 'input': {
        if (room.phase !== 'playing') return undefined;
        const p = c.player;
        for (const [seq, bits] of m.inputs) {
          if (seq <= p.lastQueued) continue;
          p.queue.push([seq, bits]);
          p.lastQueued = seq;
        }
        if (p.queue.length > MAX_QUEUE) p.queue.splice(0, p.queue.length - MAX_QUEUE);
        return undefined;
      }
      case 'emote':
        return this.broadcast(room, { type: 'event', event: { type: 'emote', i: idx, id: m.id } });
      default:
        return this.error(sock, 'bad_message');
    }
  }

  code() {
    for (let tries = 0; tries < 100; tries++) {
      let s = '';
      for (let k = 0; k < 4; k++) s += CODE_ALPHABET[Math.floor(this.rng() * CODE_ALPHABET.length)];
      if (!this.rooms.has(s)) return s;
    }
    return null;
  }

  token() {
    let s = '';
    for (let k = 0; k < 32; k++) s += Math.floor(this.rng() * 16).toString(16);
    return s;
  }

  newPlayer(sock, name) {
    return { sock, name, token: this.token(), ready: false, goneAt: 0, queue: [], lastQueued: -1, ack: -1, bits: 0 };
  }

  create(sock, c, name) {
    if (c.room) this.leave(c);
    if (this.rooms.size >= this.maxRooms) return this.error(sock, 'server_full');
    const code = this.code();
    if (!code) return this.error(sock, 'server_full');
    const p = this.newPlayer(sock, name);
    const room = { code, players: [p], leader: 0, phase: 'lobby', level: this.firstLevel, state: null, tick: 0, events: [], clearAt: -1, lastActive: this.now() };
    this.rooms.set(code, room);
    Object.assign(c, { room, player: p });
    return this.broadcastRoom(room);
  }

  join(sock, c, code, name) {
    const room = this.rooms.get(code);
    if (!room) return this.error(sock, 'no_room');
    if (room.players.length >= MAX_PLAYERS) return this.error(sock, 'room_full');
    if (room.phase !== 'lobby') return this.error(sock, 'in_progress');
    if (c.room) this.leave(c);
    const p = this.newPlayer(sock, name);
    room.players.push(p);
    room.lastActive = this.now();
    Object.assign(c, { room, player: p });
    return this.broadcastRoom(room);
  }

  rejoin(sock, c, token) {
    for (const room of this.rooms.values()) {
      const p = room.players.find((q) => q.token === token);
      if (!p) continue;
      if (p.sock && p.sock !== sock) {
        this.clients.delete(p.sock);
        this.close(p.sock);
      }
      p.sock = sock;
      p.goneAt = 0;
      Object.assign(c, { room, player: p });
      if (!room.players[room.leader]?.sock) this.handOff(room);
      this.broadcastRoom(room);
      if (room.phase === 'playing') {
        this.send(sock, this.startMsg(room, room.players.indexOf(p)));
        this.send(sock, { type: 'snap', tick: room.tick, ack: p.ack, state: encode(room.state), events: [] });
      }
      return undefined;
    }
    return this.error(sock, 'no_session');
  }

  leave(c) {
    const room = c.room;
    if (!room) return;
    this.removePlayer(room, room.players.indexOf(c.player));
    c.room = null;
    c.player = null;
  }

  removePlayer(room, idx) {
    if (idx < 0) return;
    room.players.splice(idx, 1);
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
      return;
    }
    if (room.leader === idx) this.handOff(room);
    else if (room.leader > idx) room.leader--;
    // Every blob is needed to clear a level, so losing a player ends the game.
    if (room.phase === 'playing') this.toLobby(room);
    else this.broadcastRoom(room);
  }

  handOff(room) {
    const next = room.players.findIndex((p) => p.sock);
    room.leader = next >= 0 ? next : 0;
  }

  startMsg(room, you) {
    return { type: 'start', level: room.level, playerCount: room.players.length, you };
  }

  startGame(room) {
    room.state = createWorld(this.levels.get(room.level), room.players.length);
    room.phase = 'playing';
    room.tick = 0;
    room.events = [];
    room.clearAt = -1;
    room.players.forEach((p, i) => {
      Object.assign(p, { queue: [], lastQueued: -1, ack: -1, bits: 0, ready: false });
      if (p.sock) this.send(p.sock, this.startMsg(room, i));
    });
    this.broadcastRoom(room);
  }

  toLobby(room) {
    room.phase = 'lobby';
    room.state = null;
    for (const p of room.players) p.ready = false;
    this.broadcastRoom(room);
  }

  roomMsg(room, you) {
    return {
      type: 'room',
      code: room.code,
      you,
      token: room.players[you].token,
      leader: room.leader,
      level: room.level,
      phase: room.phase,
      players: room.players.map((p) => ({ name: p.name, ready: p.ready, connected: !!p.sock })),
    };
  }

  broadcastRoom(room) {
    room.players.forEach((p, i) => {
      if (p.sock) this.send(p.sock, this.roomMsg(room, i));
    });
  }

  broadcast(room, msg) {
    for (const p of room.players) if (p.sock) this.send(p.sock, msg);
  }

  // Advance every playing room by one simulation tick.
  tick() {
    for (const room of this.rooms.values()) {
      if (room.phase !== 'playing') continue;
      const bits = room.players.map((p) => {
        const next = p.queue.shift();
        if (next) {
          p.bits = next[1];
          p.ack = next[0];
        }
        return p.sock ? p.bits : 0;
      });
      step(room.state, bits);
      room.tick++;
      room.events.push(...room.state.events);
      if (room.state.cleared && room.clearAt < 0) {
        room.clearAt = room.tick + CLEAR_HOLD;
        this.broadcast(room, { type: 'event', event: { type: 'clear', ticks: room.tick } });
      }
      if (room.tick % SNAP_EVERY === 0) {
        const state = encode(room.state);
        const events = room.events;
        room.events = [];
        for (const p of room.players) if (p.sock) this.send(p.sock, { type: 'snap', tick: room.tick, ack: p.ack, state, events });
      }
      if (room.clearAt >= 0 && room.tick >= room.clearAt) this.toLobby(room);
    }
  }

  // Expire disconnected slots and idle rooms.
  sweep() {
    const t = this.now();
    for (const room of [...this.rooms.values()]) {
      if (t - room.lastActive > IDLE_MS) {
        for (const p of room.players) if (p.sock) this.close(p.sock);
        this.rooms.delete(room.code);
        continue;
      }
      for (let i = room.players.length - 1; i >= 0; i--) {
        const p = room.players[i];
        if (!p.sock && t - p.goneAt > GRACE_MS) this.removePlayer(room, i);
      }
    }
  }
}
