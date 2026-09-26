// Tiny builder for level maps: start from an empty bordered box, then paint.
export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.cells = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) row.push(x === 0 || x === w - 1 || y === 0 ? '#' : '.');
      this.cells.push(row);
    }
  }

  // Paint the inclusive rectangle (x0,y0)-(x1,y1) with ch.
  fill(x0, y0, x1, y1, ch) {
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) this.cells[y][x] = ch;
    }
    return this;
  }

  set(x, y, ch) {
    return this.fill(x, y, x, y, ch);
  }

  // Four spawn markers in a row starting at (x, y).
  spawns(x, y) {
    return this.fill(x, y, x + 3, y, 'S');
  }

  rows() {
    return this.cells.map((r) => r.join(''));
  }
}
