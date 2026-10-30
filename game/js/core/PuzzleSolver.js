/**
 * PuzzleSolver
 * Breadth-first search over board states. Gives the shortest solution,
 * which is used for: level validation, "best" move counts, hints, and
 * dead-end detection while the child plays.
 *
 * Internally it works on flat typed arrays (positions + filled bitmask)
 * instead of BoardState objects, which makes it fast enough to run after
 * every move in the browser.
 */
class PuzzleSolver {
  /**
   * @param {BoardState} start
   * @param {number} maxNodes  search budget; result.complete=false if exceeded
   * @returns {{solvable:boolean, complete:boolean, moves:Array<{boxId:number,dir:string}>, length:number, explored:number}}
   */
  static solve(start, maxNodes) {
    const budget = maxNodes || 40000;
    const L = start.layout;
    const ctx = PuzzleSolver.context(L);
    const n = start.boxes.length;
    const ids = start.boxes.map(b => b.id);
    const colors = Int8Array.from(start.boxes.map(b => b.color));

    const pos0 = new Int16Array(n);
    start.boxes.forEach((b, i) => { pos0[i] = b.alive ? b.idx : -1; });
    const filled0 = start.filled;

    if (filled0 === L.allFilledMask) return { solvable: true, complete: true, moves: [], length: 0, explored: 1 };
    if (PuzzleSolver.stuck(L, colors, pos0, filled0)) return { solvable: false, complete: true, moves: [], length: -1, explored: 1 };

    // node storage
    const nodesPos = [pos0];
    const nodesFilled = [filled0];
    const parent = [-1];
    const moveBox = [-1];
    const moveDir = [-1];
    const seen = new Set([PuzzleSolver.key(colors, pos0, filled0)]);
    const occ = new Uint8Array(L.size);

    let head = 0;
    while (head < nodesPos.length) {
      if (head >= budget) return { solvable: false, complete: false, moves: [], length: -1, explored: head };
      const pos = nodesPos[head];
      const filled = nodesFilled[head];

      occ.fill(0);
      for (let i = 0; i < n; i++) if (pos[i] >= 0) occ[pos[i]] = 1;

      for (let i = 0; i < n; i++) {
        const from = pos[i];
        if (from < 0) continue;
        for (let d = 0; d < 4; d++) {
          const next = ctx.next[d];
          let cur = from;
          let dropHole = -1;
          let step = next[cur];
          if (step < 0 || occ[step]) continue;
          while (step >= 0 && !occ[step]) {
            cur = step;
            const h = L.holeAt[cur];
            if (h >= 0 && (filled & (1 << h)) === 0) {
              const hc = L.holes[h].color;
              if (hc === 0 || hc === colors[i]) { dropHole = h; break; }
            }
            step = next[cur];
          }

          const cPos = pos.slice();
          let cFilled = filled;
          if (dropHole >= 0) {
            cPos[i] = -1;
            cFilled = filled | (1 << dropHole);
          } else {
            cPos[i] = cur;
          }
          const k = PuzzleSolver.key(colors, cPos, cFilled);
          if (seen.has(k)) continue;
          seen.add(k);

          nodesPos.push(cPos);
          nodesFilled.push(cFilled);
          parent.push(head);
          moveBox.push(i);
          moveDir.push(d);
          const idx = nodesPos.length - 1;

          if (cFilled === L.allFilledMask) {
            const moves = [];
            for (let p = idx; parent[p] >= 0; p = parent[p]) {
              moves.push({ boxId: ids[moveBox[p]], dir: PuzzleLayout.DIR_NAMES[moveDir[p]] });
            }
            moves.reverse();
            return { solvable: true, complete: true, moves, length: moves.length, explored: head + 1 };
          }
          if (dropHole >= 0 && PuzzleSolver.stuck(L, colors, cPos, cFilled)) {
            // dead branch: keep it marked as seen, but do not expand it
            nodesPos[idx] = null;
          }
        }
      }
      head++;
      while (head < nodesPos.length && nodesPos[head] === null) head++;
    }
    return { solvable: false, complete: true, moves: [], length: -1, explored: head };
  }

  /** Precomputed neighbour tables per layout (walls count as blocked). */
  static context(L) {
    if (L._solverCtx) return L._solverCtx;
    const next = PuzzleLayout.DIR_NAMES.map(dir => {
      const t = new Int16Array(L.size);
      for (let i = 0; i < L.size; i++) {
        const s = L.step(i, dir);
        t[i] = s < 0 || L.isWall(s) ? -1 : s;
      }
      return t;
    });
    L._solverCtx = { next };
    return L._solverCtx;
  }

  /** Not enough crates of each colour left for the open holes? */
  static stuck(L, colors, pos, filled) {
    const have = [0, 0, 0, 0, 0];
    let total = 0;
    for (let i = 0; i < pos.length; i++) {
      if (pos[i] >= 0) { have[colors[i]]++; total++; }
    }
    let needTotal = 0;
    for (let h = 0; h < L.holes.length; h++) {
      if (filled & (1 << h)) continue;
      needTotal++;
      const c = L.holes[h].color;
      if (c > 0) {
        have[c]--;
        if (have[c] < 0) return true;
      }
    }
    return total < needTotal;
  }

  /** Canonical key: crates of the same colour are interchangeable. */
  static key(colors, pos, filled) {
    const groups = [[], [], [], [], []];
    for (let i = 0; i < pos.length; i++) if (pos[i] >= 0) groups[colors[i]].push(pos[i]);
    let k = String(filled);
    for (let c = 0; c < groups.length; c++) {
      const g = groups[c];
      if (!g.length) continue;
      g.sort((a, b) => a - b);
      k += '|' + c + ':' + g.join(',');
    }
    return k;
  }

  /**
   * How many of the possible first moves lead to an unsolvable board?
   * A level with traps forces the child to think before acting.
   */
  static trapInfo(start, maxNodes) {
    const moves = start.legalMoves();
    let traps = 0;
    let unknown = 0;
    for (const mv of moves) {
      const s = start.clone();
      s.apply(mv.boxId, mv.dir);
      const r = PuzzleSolver.solve(s, maxNodes || 8000);
      if (!r.complete) unknown++;
      else if (!r.solvable) traps++;
    }
    return { firstMoves: moves.length, traps, unknown, ratio: moves.length ? traps / moves.length : 0 };
  }
}

if (typeof module !== 'undefined') {
  global.PuzzleLayout = global.PuzzleLayout || require('./PuzzleLayout');
  module.exports = PuzzleSolver;
}
