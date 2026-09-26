export const PUSH_X = 13 * 64; // pusher centre on the shelf edge: crate is fully off
export const powered = { do: 'until', label: 'power on', test: (s) => s.plates[0].active };
export const liftReady = { do: 'until', label: 'lift at bottom', test: (s) => s.lifts[0].t === 0 && s.lifts[0].wait > 80 };
export const liftTop = { do: 'until', label: 'lift at top', test: (s) => s.lifts[0].t === 1 };
