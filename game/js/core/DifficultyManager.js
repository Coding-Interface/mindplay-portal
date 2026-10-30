/**
 * DifficultyManager
 * Two modes:
 *  - 'fixed'    (default) level N always comes from slot N. Scores are
 *               comparable between children and sessions.
 *  - 'adaptive' after each level the next level may come from one slot
 *               easier or harder, based on how the child did (range -2..+2).
 */
class DifficultyManager {
  constructor(mode) {
    this.mode = mode === 'adaptive' ? 'adaptive' : 'fixed';
    this.shift = 0;
    this.strongStreak = 0;
    this.weakStreak = 0;
  }

  slotFor(levelIndex, slotCount) {
    const s = this.mode === 'adaptive' ? levelIndex + this.shift : levelIndex;
    return Math.max(0, Math.min(slotCount - 1, s));
  }

  /** @param {object} result  level record from MetricsTracker */
  update(result) {
    if (this.mode !== 'adaptive') return this.shift;

    const strong = result.solved && result.stars === 3 && result.hints === 0;
    const weak = !result.solved || result.hints >= 2 || result.restarts >= 3 || result.deadEnds >= 3;

    if (strong) {
      this.strongStreak++;
      this.weakStreak = 0;
    } else if (weak) {
      this.weakStreak++;
      this.strongStreak = 0;
    } else {
      this.strongStreak = 0;
      this.weakStreak = 0;
    }

    if (this.strongStreak >= 2) {
      this.shift = Math.min(2, this.shift + 1);
      this.strongStreak = 0;
    }
    if (this.weakStreak >= 1) {
      this.shift = Math.max(-2, this.shift - 1);
      this.weakStreak = 0;
    }
    return this.shift;
  }
}
