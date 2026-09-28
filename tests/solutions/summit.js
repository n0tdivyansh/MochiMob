export const liftReady = { do: 'until', label: 'lift at bottom', test: (s) => s.lifts[0].t === 0 && s.lifts[0].wait > 90 };
export const liftTop = { do: 'until', label: 'lift at top', test: (s) => s.lifts[0].t === 1 };
export const powered = { do: 'until', label: 'power latched', test: (s) => s.plates[0].latched };
