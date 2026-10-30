/**
 * JarState
 * The spice jars. Each jar is a string, bottom → top, one character per scoop
 * ('a' = spice 0, 'b' = spice 1, …). All jars share one capacity.
 *
 * Rules:
 *  - Pour from jar A into jar B if A is not empty, B is not full, and B is empty
 *    or B's top spice is the same as A's top spice.
 *  - A pour moves as many matching scoops from A's top as fit in B.
 *  - Solved when every jar is empty or full of one spice.
 */
class JarState {
  constructor(jars, capacity) {
    this.jars = jars.slice();
    this.capacity = capacity;
  }

  clone() {
    return new JarState(this.jars, this.capacity);
  }

  top(i) {
    const j = this.jars[i];
    return j.length ? j[j.length - 1] : null;
  }

  /** How many scoops of the same spice sit together on top of jar i. */
  topRun(i) {
    const j = this.jars[i];
    if (!j.length) return 0;
    const c = j[j.length - 1];
    let n = 0;
    for (let k = j.length - 1; k >= 0 && j[k] === c; k--) n++;
    return n;
  }

  isComplete(i) {
    const j = this.jars[i];
    return j.length === this.capacity && this.topRun(i) === this.capacity;
  }

  isUniform(i) {
    const j = this.jars[i];
    return j.length > 0 && this.topRun(i) === j.length;
  }

  /** Scoops that would move, or 0 if the pour is not allowed. */
  pourAmount(a, b) {
    if (a === b) return 0;
    const A = this.jars[a];
    const B = this.jars[b];
    if (!A.length || B.length >= this.capacity) return 0;
    if (B.length && B[B.length - 1] !== A[A.length - 1]) return 0;
    return Math.min(this.topRun(a), this.capacity - B.length);
  }

  pour(a, b) {
    const n = this.pourAmount(a, b);
    if (!n) return 0;
    const c = this.top(a);
    this.jars[a] = this.jars[a].slice(0, this.jars[a].length - n);
    this.jars[b] = this.jars[b] + c.repeat(n);
    return n;
  }

  isSolved() {
    for (let i = 0; i < this.jars.length; i++) {
      const j = this.jars[i];
      if (j.length && !this.isComplete(i)) return false;
    }
    return true;
  }

  /**
   * Useful moves only (prunes moves that can never help):
   *  - never pour out of a finished jar
   *  - never pour a one-spice jar into an empty jar
   *  - among empty jars, try only the first one
   */
  legalMoves() {
    const moves = [];
    const n = this.jars.length;
    for (let a = 0; a < n; a++) {
      if (!this.jars[a].length || this.isComplete(a)) continue;
      let triedEmpty = false;
      for (let b = 0; b < n; b++) {
        if (a === b) continue;
        const empty = this.jars[b].length === 0;
        if (empty) {
          if (triedEmpty || this.isUniform(a)) continue;
          triedEmpty = true;
        }
        if (this.pourAmount(a, b)) moves.push({ from: a, to: b });
      }
    }
    return moves;
  }

  /** Any pour at all (used to tell the child "no moves left"). */
  anyPour() {
    for (let a = 0; a < this.jars.length; a++) {
      for (let b = 0; b < this.jars.length; b++) if (this.pourAmount(a, b)) return true;
    }
    return false;
  }

  /** Jars are interchangeable, so sort them for a canonical key. */
  key() {
    return this.jars.slice().sort().join('|');
  }
}

if (typeof module !== 'undefined') module.exports = JarState;
