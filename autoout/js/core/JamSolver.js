/**
 * JamSolver
 * Breadth-first search for the fewest moves (a slide of any length counts as
 * one move). Used to check levels offline, to show "best possible", for hints
 * and to count how far the child is from the solution.
 */
class JamSolver {
  static solve(start, budget) {
    const max = budget || 200000;
    if (start.isSolved()) return { solvable: true, complete: true, moves: [], length: 0, explored: 0 };
    const nodes = [start.pos.slice()];
    const parent = [-1];
    const mId = [-1];
    const mDelta = [0];
    const seen = new Set([start.key()]);
    const b = start.clone();
    let head = 0;
    while (head < nodes.length) {
      if (head >= max) return { solvable: false, complete: false, moves: [], length: -1, explored: head };
      b.pos = nodes[head].slice();
      const moves = b.legalMoves();
      for (const m of moves) {
        const child = nodes[head].slice();
        child[m.id] += m.delta;
        const k = child.join(',');
        if (seen.has(k)) continue;
        seen.add(k);
        nodes.push(child);
        parent.push(head);
        mId.push(m.id);
        mDelta.push(m.delta);
        if (child[0] + start.vehicles[0].len === start.size) {
          const out = [];
          for (let p = nodes.length - 1; parent[p] >= 0; p = parent[p]) out.push({ id: mId[p], delta: mDelta[p] });
          out.reverse();
          return { solvable: true, complete: true, moves: out, length: out.length, explored: head + 1 };
        }
      }
      head++;
    }
    return { solvable: false, complete: true, moves: [], length: -1, explored: head };
  }
}

if (typeof module !== 'undefined') {
  global.JamBoard = global.JamBoard || require('./JamBoard');
  module.exports = JamSolver;
}
