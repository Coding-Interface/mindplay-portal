/**
 * PuzzleLayout
 * The static part of a level: grid size, walls and holes.
 * Cells are addressed by index = row * cols + col.
 *
 * JSON shape (also used for hand-made levels):
 * {
 *   cols: 7, rows: 6,
 *   walls: [idx, ...],
 *   holes: [{ idx, color }, ...],      // color 0 = any box fits
 *   boxes: [{ idx, color }, ...]
 * }
 */
class PuzzleLayout {
  constructor(data) {
    this.cols = data.cols;
    this.rows = data.rows;
    this.size = this.cols * this.rows;
    this.walls = data.walls.slice();
    this.holes = data.holes.map(h => ({ idx: h.idx, color: h.color || 0 }));
    this.startBoxes = data.boxes.map((b, i) => ({ id: i, idx: b.idx, color: b.color || 0 }));

    this.wallGrid = new Uint8Array(this.size);
    this.walls.forEach(i => { this.wallGrid[i] = 1; });

    this.holeAt = new Int8Array(this.size).fill(-1);
    this.holes.forEach((h, i) => { this.holeAt[h.idx] = i; });

    this.allFilledMask = (1 << this.holes.length) - 1;
    this.usesColors = this.holes.some(h => h.color > 0) || this.startBoxes.some(b => b.color > 0);
  }

  col(idx) { return idx % this.cols; }
  row(idx) { return Math.floor(idx / this.cols); }

  /** Next cell index in direction, or -1 if off the board. */
  step(idx, dir) {
    const c = idx % this.cols;
    const r = (idx - c) / this.cols;
    const nc = c + PuzzleLayout.DIRS[dir].dc;
    const nr = r + PuzzleLayout.DIRS[dir].dr;
    if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) return -1;
    return nr * this.cols + nc;
  }

  isWall(idx) { return this.wallGrid[idx] === 1; }

  /** Does a box of this colour drop into this hole? */
  fits(holeIndex, boxColor) {
    const hc = this.holes[holeIndex].color;
    return hc === 0 || hc === boxColor;
  }

  toJSON() {
    return {
      cols: this.cols,
      rows: this.rows,
      walls: this.walls.slice(),
      holes: this.holes.map(h => ({ idx: h.idx, color: h.color })),
      boxes: this.startBoxes.map(b => ({ idx: b.idx, color: b.color }))
    };
  }
}

PuzzleLayout.DIRS = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 }
};
PuzzleLayout.DIR_NAMES = ['up', 'down', 'left', 'right'];

if (typeof module !== 'undefined') module.exports = PuzzleLayout;
