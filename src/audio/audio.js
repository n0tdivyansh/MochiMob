// All sound is synthesized with WebAudio: no audio files ship with the game.
import { SONGS } from './songs.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function createAudio() {
  let ac = null;
  let master;
  let musicBus;
  let sfxBus;
  let noise;
  let vol = { master: 0.8, music: 0.6, sfx: 0.8 };
  let song = null;
  let songName = null;
  let step = 0;
  let nextTime = 0;
  let timer = 0;

  function applyVolumes() {
    if (!ac) return;
    master.gain.value = vol.master;
    musicBus.gain.value = vol.music * 0.5;
    sfxBus.gain.value = vol.sfx;
  }

  // Create the context on the first user gesture (browsers block autoplay).
  function init() {
    if (ac) {
      if (ac.state === 'suspended') ac.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    musicBus = ac.createGain();
    sfxBus = ac.createGain();
    const comp = ac.createDynamicsCompressor();
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(comp);
    comp.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
    applyVolumes();
    if (songName) {
      const name = songName;
      songName = null;
      play(name);
    }
  }

  function tone({ type = 'sine', f0, f1 = f0, t = ac.currentTime, dur = 0.15, gain = 0.3, bus = sfxBus, attack = 0.005 }) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function hiss({ t = ac.currentTime, dur = 0.15, gain = 0.25, freq = 1200, q = 1, type = 'bandpass', bus = sfxBus }) {
    const src = ac.createBufferSource();
    src.buffer = noise;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const now = () => ac.currentTime;
  const SFX = {
    jump: () => tone({ f0: 330, f1: 660, dur: 0.14, gain: 0.25 }),
    land: () => {
      tone({ f0: 140, f1: 60, dur: 0.12, gain: 0.35 });
      hiss({ dur: 0.08, gain: 0.08, freq: 500 });
    },
    squish: () => tone({ type: 'square', f0: 260, f1: 90, dur: 0.18, gain: 0.12 }),
    unsquish: () => tone({ type: 'square', f0: 110, f1: 240, dur: 0.12, gain: 0.08 }),
    bounce: () => {
      tone({ f0: 220, f1: 990, dur: 0.3, gain: 0.3 });
      tone({ type: 'triangle', f0: 440, f1: 1320, dur: 0.22, gain: 0.12, t: now() + 0.03 });
    },
    pad: () => tone({ f0: 200, f1: 800, dur: 0.25, gain: 0.28 }),
    key: () => {
      tone({ type: 'triangle', f0: midi(88), dur: 0.25, gain: 0.2 });
      tone({ type: 'triangle', f0: midi(95), dur: 0.35, gain: 0.2, t: now() + 0.09 });
    },
    unlock: () => [76, 80, 83, 88].forEach((n, k) => tone({ type: 'triangle', f0: midi(n), dur: 0.3, gain: 0.18, t: now() + k * 0.07 })),
    enter: () => tone({ type: 'triangle', f0: midi(79), f1: midi(91), dur: 0.2, gain: 0.18 }),
    exit: () => tone({ type: 'triangle', f0: midi(91), f1: midi(79), dur: 0.2, gain: 0.15 }),
    plateOn: () => tone({ type: 'square', f0: 900, f1: 600, dur: 0.05, gain: 0.08 }),
    plateOff: () => tone({ type: 'square', f0: 500, f1: 400, dur: 0.05, gain: 0.05 }),
    gateOpen: () => hiss({ dur: 0.45, gain: 0.12, freq: 700, q: 0.7, type: 'lowpass' }),
    gateClose: () => hiss({ dur: 0.35, gain: 0.1, freq: 500, q: 0.7, type: 'lowpass' }),
    die: () => {
      hiss({ dur: 0.25, gain: 0.3, freq: 1800, q: 0.5 });
      tone({ f0: 600, f1: 90, dur: 0.3, gain: 0.25 });
    },
    respawn: () => [72, 79, 84].forEach((n, k) => tone({ f0: midi(n), dur: 0.15, gain: 0.12, t: now() + k * 0.05 })),
    checkpoint: () => [79, 84].forEach((n, k) => tone({ type: 'triangle', f0: midi(n), dur: 0.25, gain: 0.16, t: now() + k * 0.1 })),
    paint: () => hiss({ dur: 0.25, gain: 0.2, freq: 900, q: 2 }),
    crateReset: () => hiss({ dur: 0.3, gain: 0.15, freq: 400 }),
    clear: () => {
      const t = now();
      [72, 76, 79, 84, 79, 84, 88].forEach((n, k) => tone({ type: 'triangle', f0: midi(n), dur: k === 6 ? 0.8 : 0.18, gain: 0.2, t: t + k * 0.1 }));
      [48, 55, 60].forEach((n) => tone({ f0: midi(n), dur: 1.2, gain: 0.12, t: t + 0.6 }));
    },
    swap: () => tone({ f0: 700, f1: 900, dur: 0.06, gain: 0.1 }),
    follow: () => tone({ f0: 500, f1: 750, dur: 0.1, gain: 0.1 }),
    ui: () => tone({ f0: 880, dur: 0.05, gain: 0.08 }),
    ok: () => tone({ type: 'triangle', f0: 660, f1: 990, dur: 0.1, gain: 0.12 }),
    back: () => tone({ type: 'triangle', f0: 660, f1: 440, dur: 0.1, gain: 0.1 }),
    push: () => tone({ type: 'sawtooth', f0: 70, f1: 60, dur: 0.1, gain: 0.04 }),
  };

  function sfx(name) {
    if (!ac || ac.state !== 'running' || !SFX[name]) return;
    SFX[name]();
  }

  // Map one tick of simulation events to sounds; one sound per event type per tick.
  function events(list) {
    const seen = new Set();
    for (const e of list) {
      if (seen.has(e.type)) continue;
      seen.add(e.type);
      if (e.type === 'push' && Math.random() > 0.15) continue;
      if (e.type === 'land' && e.v < 450) continue;
      sfx(e.type);
    }
  }

  function scheduleStep(t) {
    const s = song;
    const i = step % s.lead.length;
    const beat = 60 / s.bpm / 4;
    const lead = s.lead[i];
    if (lead !== null) tone({ type: 'triangle', f0: midi(lead), t, dur: beat * 1.8, gain: 0.16, bus: musicBus, attack: 0.01 });
    const bass = s.bass[i % s.bass.length];
    if (bass !== null) tone({ type: 'square', f0: midi(bass), t, dur: beat * 1.6, gain: 0.06, bus: musicBus, attack: 0.01 });
    if (s.chords && i % 16 === 0) {
      const chord = s.chords[Math.floor(i / 16) % s.chords.length];
      chord.forEach((n) => tone({ f0: midi(n), t, dur: beat * 15, gain: 0.035, bus: musicBus, attack: 0.3 }));
    }
    const hat = s.hats[i % s.hats.length];
    if (hat === 1) hiss({ t, dur: 0.04, gain: 0.035, freq: 7000, q: 0.8, type: 'highpass', bus: musicBus });
    if (hat === 2) hiss({ t, dur: 0.12, gain: 0.08, freq: 160, q: 0.8, type: 'lowpass', bus: musicBus });
  }

  function tick() {
    if (!ac || !song) return;
    while (nextTime < ac.currentTime + 0.12) {
      scheduleStep(nextTime);
      nextTime += 60 / song.bpm / 4;
      step++;
    }
  }

  function play(name) {
    if (songName === name && song) return;
    songName = name;
    if (!ac) return;
    song = SONGS[name] ?? null;
    step = 0;
    nextTime = ac.currentTime + 0.05;
    clearInterval(timer);
    if (song) timer = setInterval(tick, 25);
  }

  function stop() {
    song = null;
    songName = null;
    clearInterval(timer);
  }

  return {
    init,
    sfx,
    events,
    play,
    stop,
    setVolumes(v) {
      vol = { ...vol, ...v };
      applyVolumes();
    },
  };
}
