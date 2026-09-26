import { MAX_SPAN_X } from './constants.js';

export const VIEW_W = 1920;
export const VIEW_H = 1080;
export const MIN_ZOOM = 0.65;
const MARGIN_X = 300;
const MARGIN_Y = 220;

function liveBlobs(state) {
  return state.blobs.filter((b) => b.alive && !b.inDoor);
}

// Co-op screen-edge walls: no blob may get farther than MAX_SPAN_X from any
// other living blob. Returns the allowed x range for `blob`, or null (no limit).
export function spanLimits(state, blob) {
  if (state.solo) return null;
  let minO = Infinity;
  let maxO = -Infinity;
  for (const o of state.blobs) {
    if (o === blob || !o.alive || o.inDoor) continue;
    minO = Math.min(minO, o.x);
    maxO = Math.max(maxO, o.x);
  }
  if (minO === Infinity) return null;
  return { min: maxO - MAX_SPAN_X, max: minO + MAX_SPAN_X };
}

function clampAxis(center, half, size) {
  if (size <= half * 2) return size / 2;
  return Math.min(Math.max(center, half), size - half);
}

function frame(state, box) {
  const w = box.maxX - box.minX + MARGIN_X * 2;
  const h = box.maxY - box.minY + MARGIN_Y * 2;
  let zoom = Math.min(1, VIEW_W / w, VIEW_H / h);
  zoom = Math.max(MIN_ZOOM, zoom);
  const halfW = VIEW_W / zoom / 2;
  const halfH = VIEW_H / zoom / 2;
  return {
    x: clampAxis((box.minX + box.maxX) / 2, halfW, state.static.W),
    y: clampAxis((box.minY + box.maxY) / 2, halfH, state.static.H),
    zoom,
    fit: zoom * w >= VIEW_W - 1e-6 ? zoom === Math.min(1, VIEW_W / w, VIEW_H / h) : true,
  };
}

function boxOf(list) {
  const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const b of list) {
    box.minX = Math.min(box.minX, b.x);
    box.maxX = Math.max(box.maxX, b.x + b.w);
    box.minY = Math.min(box.minY, b.y);
    box.maxY = Math.max(box.maxY, b.y + b.h);
  }
  return box;
}

// Where the camera wants to be: {x, y} centre in world px and zoom.
export function cameraTarget(state) {
  let list = liveBlobs(state);
  if (list.length === 0) list = [state.door];
  if (state.solo) {
    const active = state.blobs[state.solo.active];
    const focus = active.alive && !active.inDoor ? active : list[0];
    const all = frame(state, boxOf(list));
    const halfW = VIEW_W / all.zoom / 2;
    const halfH = VIEW_H / all.zoom / 2;
    const cx = focus.x + focus.w / 2;
    const cy = focus.y + focus.h / 2;
    const inner = Math.abs(cx - all.x) <= halfW * 0.6 && Math.abs(cy - all.y) <= halfH * 0.6;
    const allVisible = list.every((b) => b.x >= all.x - halfW && b.x + b.w <= all.x + halfW);
    if (inner && allVisible) return { x: all.x, y: all.y, zoom: all.zoom };
    const zoom = 0.85;
    return {
      x: clampAxis(cx, VIEW_W / zoom / 2, state.static.W),
      y: clampAxis(cy, VIEW_H / zoom / 2, state.static.H),
      zoom,
    };
  }
  const f = frame(state, boxOf(list));
  return { x: f.x, y: f.y, zoom: f.zoom };
}
