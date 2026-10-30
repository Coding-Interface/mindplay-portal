/**
 * LevelPicker
 * Chooses levels from the pre-built bank (data/levels.json).
 * The bank holds a pool of solver-verified puzzles for each of the 10 slots
 * in each grade band. Level N of a session is always drawn from slot N's pool
 * (or a neighbouring slot in adaptive mode), so difficulty is the same every
 * session while the puzzles themselves change.
 *
 * Levels the child played recently are avoided until the pool runs out.
 */
class LevelPicker {
  constructor(bank, band, storage, seed) {
    this.bank = bank;
    this.band = band;
    this.pools = bank.bands[band];
    this.storage = storage;
    this.rng = new SeededRandom(seed);
    this.usedThisSession = new Set();
    this.recentKey = 'recent-' + band;
    this.recent = storage.get(this.recentKey, []);
  }

  slotCount() {
    return this.pools.length;
  }

  /**
   * @param {number} slotIndex 0-based slot (already clamped by caller)
   * @returns {object} a level record from the bank
   */
  pick(slotIndex) {
    const i = Math.max(0, Math.min(this.pools.length - 1, slotIndex));
    const pool = this.pools[i];
    const recentSet = new Set(this.recent);

    let candidates = pool.filter(l => !this.usedThisSession.has(l.id) && !recentSet.has(l.id));
    if (!candidates.length) candidates = pool.filter(l => !this.usedThisSession.has(l.id));
    if (!candidates.length) candidates = pool;

    const level = this.rng.pick(candidates);
    this.remember(level.id);
    return level;
  }

  remember(id) {
    this.usedThisSession.add(id);
    this.recent = this.recent.filter(x => x !== id);
    this.recent.push(id);
    // keep enough history to cycle through most of each pool
    const keep = Math.max(20, Math.floor(this.bank.perSlot * this.pools.length * 0.7));
    if (this.recent.length > keep) this.recent = this.recent.slice(-keep);
    this.storage.set(this.recentKey, this.recent);
  }
}
