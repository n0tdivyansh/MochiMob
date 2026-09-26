import { atStart, atEnd, A_SPOTS, B_SPOTS } from '../boughs.js';
import { finish } from '../tether.js';

const front = (n) => Array.from({ length: n }, (_, k) => n - 1 - k);

export default (n) => [
  { do: 'par', steps: front(n).map((p, k) => ({ do: 'walk', p, to: 10.5 - k * 1.1, tol: 20 })) },
  atStart(0),
  { do: 'par', steps: front(n).map((p, k) => ({ do: 'walk', p, to: A_SPOTS[k], tol: 5, hop: k === 3 })) },
  atEnd(0),
  {
    do: 'dyn',
    label: 'hop to bough B',
    make: (s) => {
      const order = s.blobs.slice().sort((a, b) => b.x - a.x || a.y - b.y).map((b) => b.i);
      // Jump off the right end of bough A (x = 22 tiles) onto parked bough B.
      return [{ do: 'par', steps: order.map((p, k) => ({ do: 'walkJump', p, to: B_SPOTS[k], at: 21.6, tol: 6 })) }];
    },
  },
  atStart(1),
  finish(n, 38),
];
