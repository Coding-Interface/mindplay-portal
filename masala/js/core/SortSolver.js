/**
 * SortSolver
 * Breadth-first search for the fewest pours. Used to check levels offline,
 * to show the "best possible" count, for hints, and to spot dead ends.
 */
class SortSolver {
  /**
   * @param {JarState} start
   * @param {number} budget  max states to expand
   * @returns {{solvable:boolean, complete:boolean, moves:Array<{from,to}>, length:number, explored:number}}
   */
  static solve(start, budget) {
    const max = budget || 200000;
    if (start.isSolved()) return { solvable: true, complete: true, moves: [], length: 0, explored: 0 };
    const cap = start.capacity;
    const nodes = [start.jars.slice()];
    const parent = [-1];
    const mFrom = [-1];
    const mTo = [-1];
    const seen = new Set([start.key()]);
    let head = 0;
    const st = new JarState([], cap);

    while (head < nodes.length) {
      if (head >= max) return { solvable: false, complete: false, moves: [], length: -1, explored: head };
      st.jars = nodes[head];
      const moves = st.legalMoves();
      for (const m of moves) {
        const child = new JarState(nodes[head], cap);
        child.pour(m.from, m.to);
        const k = child.key();
        if (seen.has(k)) continue;
        seen.add(k);
        nodes.push(child.jars);
        parent.push(head);
        mFrom.push(m.from);
        mTo.push(m.to);
        if (child.isSolved()) {
          const out = [];
          for (let p = nodes.length - 1; parent[p] >= 0; p = parent[p]) out.push({ from: mFrom[p], to: mTo[p] });
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
  global.JarState = global.JarState || require('./JarState');
  module.exports = SortSolver;
}
