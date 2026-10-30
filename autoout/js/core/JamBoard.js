/**
 * JamBoard
 * A traffic jam at the school gate on a 6×6 lane grid.
 *
 * Vehicles: { id, kind, len, horiz, fixed } — position is stored separately in
 * `pos` (column for horizontal vehicles, row for vertical ones), plus a fixed
 * `lane` (row for horizontal, column for vertical).
 * Vehicle 0 is the school van. It is horizontal, in the gate row, and the gate
 * is on the right edge: the puzzle is solved when the van reaches the gate.
 *
 * Rules:
 *  - A vehicle only moves forward or backward along its lane.
 *  - It can slide any number of free cells in one move.
 *  - Cows and barricades (fixed) never move.
 */
class JamBoard {
  constructor(size, vehicles, pos) {
    this.size = size;
    this.vehicles = vehicles;             // shared, never changes
    this.pos = pos.slice();               // changes with moves
  }

  static fromLevel(level) {
    const vehicles = level.vehicles.map((v, i) => ({
      id: i, kind: v.kind, len: v.len, horiz: v.horiz, lane: v.lane, fixed: !!v.fixed
    }));
    return new JamBoard(level.size, vehicles, level.vehicles.map(v => v.pos));
  }

  clone() {
    return new JamBoard(this.size, this.vehicles, this.pos);
  }

  /** Cells covered by vehicle i, as [row, col] pairs. */
  cells(i) {
    const v = this.vehicles[i];
    const p = this.pos[i];
    const out = [];
    for (let k = 0; k < v.len; k++) out.push(v.horiz ? [v.lane, p + k] : [p + k, v.lane]);
    return out;
  }

  /** size×size grid of vehicle ids (-1 = empty). */
  grid() {
    const n = this.size;
    const g = new Int8Array(n * n).fill(-1);
    for (let i = 0; i < this.vehicles.length; i++) {
      this.cells(i).forEach(([r, c]) => { g[r * n + c] = i; });
    }
    return g;
  }

  /** How far vehicle i can slide back (negative direction) and forward. */
  range(i, grid) {
    const g = grid || this.grid();
    const v = this.vehicles[i];
    if (v.fixed) return { back: 0, fwd: 0 };
    const n = this.size;
    const p = this.pos[i];
    const at = k => (v.horiz ? g[v.lane * n + k] : g[k * n + v.lane]);
    let back = 0;
    for (let k = p - 1; k >= 0 && at(k) === -1; k--) back++;
    let fwd = 0;
    for (let k = p + v.len; k < n && at(k) === -1; k++) fwd++;
    return { back, fwd };
  }

  /** Move vehicle i by delta cells (negative = up/left). Returns false if blocked. */
  move(i, delta) {
    if (!delta) return false;
    const r = this.range(i);
    if (delta < 0 && -delta > r.back) return false;
    if (delta > 0 && delta > r.fwd) return false;
    this.pos[i] += delta;
    return true;
  }

  isSolved() {
    return this.pos[0] + this.vehicles[0].len === this.size;
  }

  key() {
    return this.pos.join(',');
  }

  /** Every legal move as { id, delta }. */
  legalMoves() {
    const g = this.grid();
    const moves = [];
    for (let i = 0; i < this.vehicles.length; i++) {
      const r = this.range(i, g);
      for (let d = 1; d <= r.back; d++) moves.push({ id: i, delta: -d });
      for (let d = 1; d <= r.fwd; d++) moves.push({ id: i, delta: d });
    }
    return moves;
  }
}

JamBoard.GATE_ROW = 2;

if (typeof module !== 'undefined') module.exports = JamBoard;
