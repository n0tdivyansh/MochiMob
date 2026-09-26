import { canopy } from '../canopy.js';

export default () => canopy((p, step) => ({ do: 'seq', steps: [{ do: 'swap', to: p }, step] }), true);
