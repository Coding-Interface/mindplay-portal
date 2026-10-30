/**
 * BoardState
 * The changing part of a level: where the boxes are and which holes are filled.
 *
 * Rules:
 *  - A box slides in a straight line until the next cell is a wall, another box
 *    or the board edge.
 *  - If it passes over an empty hole it fits (same colour, or uncoloured hole),
 *    it drops in: the hole becomes floor and the box is used up.
 *  - A hole of a different colour is passed over like floor.
 *  - The level is solved when every hole is filled.
 */
class BoardState {
  constructor(layout, boxes, filledMask) {
    this.layout = layout;
    this.boxes = boxes || layout.startBoxes.map(b => ({ id: b.id, idx: b.idx, color: b.color, alive: true }));
    this.filled = filledMask || 0;
  }

  clone() {
    return new BoardState(this.layout, this.boxes.map(b => ({ id: b.id, idx: b.idx, color: b.color, alive: b.alive })), this.filled);
  }

  boxAt(idx) {
    for (let i = 0; i < this.boxes.length; i++) {
      const b = this.boxes[i];
      if (b.alive && b.idx === idx) return b;
    }
    return null;
  }

  getBox(id) {
    return this.boxes.find(b => b.id === id) || null;
  }

  isHoleOpen(holeIndex) {
    return (this.filled & (1 << holeIndex)) === 0;
  }

  /**
   * Work out where a box would go, without changing state.
   * @returns {null | {path:number[], endIdx:number, holeIndex:number}}
   *   path excludes the start cell. holeIndex is -1 if the box does not drop.
   */
  simulate(boxId, dir) {
    const L = this.layout;
    const box = this.getBox(boxId);
    if (!box || !box.alive) return null;

    const path = [];
    let cur = box.idx;
    while (true) {
      const nxt = L.step(cur, dir);
      if (nxt < 0 || L.isWall(nxt) || this.boxAt(nxt)) break;
      cur = nxt;
      path.push(cur);
      const h = L.holeAt[cur];
      if (h >= 0 && this.isHoleOpen(h) && L.fits(h, box.color)) {
        return { path, endIdx: cur, holeIndex: h };
      }
    }
    if (path.length === 0) return null;
    return { path, endIdx: cur, holeIndex: -1 };
  }

  /** Apply a move. Returns the simulate() result, or null if the move is not possible. */
  apply(boxId, dir) {
    const res = this.simulate(boxId, dir);
    if (!res) return null;
    const box = this.getBox(boxId);
    box.idx = res.endIdx;
    if (res.holeIndex >= 0) {
      box.alive = false;
      this.filled |= (1 << res.holeIndex);
    }
    return res;
  }

  /** All legal moves from here. */
  legalMoves() {
    const moves = [];
    for (const b of this.boxes) {
      if (!b.alive) continue;
      for (const d of PuzzleLayout.DIR_NAMES) {
        if (this.simulate(b.id, d)) moves.push({ boxId: b.id, dir: d });
      }
    }
    return moves;
  }

  isSolved() {
    return this.filled === this.layout.allFilledMask;
  }

  /**
   * Fast "obviously stuck" check: for every colour, are there enough boxes
   * left to fill the open holes that need that colour?
   */
  isObviouslyStuck() {
    const L = this.layout;
    const need = {};
    let needAny = 0;
    L.holes.forEach((h, i) => {
      if (!this.isHoleOpen(i)) return;
      if (h.color === 0) needAny++;
      else need[h.color] = (need[h.color] || 0) + 1;
    });
    const have = {};
    let total = 0;
    this.boxes.forEach(b => {
      if (!b.alive) return;
      have[b.color] = (have[b.color] || 0) + 1;
      total++;
    });
    let needTotal = needAny;
    for (const c in need) {
      if ((have[c] || 0) < need[c]) return true;
      needTotal += need[c];
    }
    return total < needTotal;
  }

  /** Canonical key: boxes of the same colour are interchangeable. */
  key() {
    const groups = {};
    for (const b of this.boxes) {
      if (!b.alive) continue;
      (groups[b.color] = groups[b.color] || []).push(b.idx);
    }
    let k = this.filled + '|';
    Object.keys(groups).sort().forEach(c => {
      k += c + ':' + groups[c].sort((a, b) => a - b).join(',') + ';';
    });
    return k;
  }
}

if (typeof module !== 'undefined') {
  global.PuzzleLayout = global.PuzzleLayout || require('./PuzzleLayout');
  module.exports = BoardState;
}
