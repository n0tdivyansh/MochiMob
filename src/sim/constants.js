// All simulation tuning values. Units: pixels, seconds, ticks (1 tick = DT).
export const DT = 1 / 60;
export const TILE = 64;

export const GRAVITY = 2600;
export const MAX_FALL = 1400;
export const RUN = 380;
export const ACCEL_GROUND = 3200;
export const ACCEL_AIR = 2200;
export const FRICTION = 3600;
export const JUMP_V = 900;
export const JUMP_CUT = 0.4;
export const COYOTE = 6;
export const JUMP_BUFFER = 7;

export const BLOB_W = 52;
export const BLOB_H = 48;
export const SQUISH_H = 24;
export const BOUNCE_V = 1500;
export const PAD_V = 1300;

export const PUSH_SPEED = 200;
export const CONVEYOR = 160;
export const KEY_LERP = 0.2;
export const RESPAWN_TICKS = 48;
export const TETHER_LEN = 320;
export const MAX_SPAN_X = 2800;
export const FOLLOW_STOP = 72;
export const GATE_SPEED = 3; // open fraction per second

export const INPUT = { LEFT: 1, RIGHT: 2, JUMP: 4, SQUISH: 8, UP: 16 };

export const COLORS = ['#ff7aa2', '#7fcf6a', '#ffd24d', '#a68bff'];
export const COLOR_NAMES = ['Strawberry', 'Matcha', 'Yuzu', 'Ube'];
export const GLYPHS = ['heart', 'leaf', 'star', 'moon'];

// Tile codes stored in static.tiles
export const T = {
  EMPTY: 0,
  SOLID: 1,
  ONEWAY: 2,
  SPIKES: 3,
  CONV_R: 4,
  CONV_L: 5,
  LOW: 6, // solid top half (low ceiling)
  PAD: 7, // bounce pad: solid bottom 24 px
};
export const ONEWAY_H = 16;
export const LOW_H = 32;
export const PAD_H = 24;
export const SPIKE_H = 28;
