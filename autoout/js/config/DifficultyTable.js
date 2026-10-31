/**
 * DifficultyTable
 * One fixed 10-level curve per grade band. Every session draws new jams
 * from the bank, but level N always uses the same recipe.
 *
 *  size       lot size (6 = 6×6, 7 = 7×7, 8 = 8×8). The last levels use bigger lots.
 *  vehicles   other vehicles besides the school van
 *  blockers   cows, police barricades and sabzi carts that never move
 *  minMoves / maxMoves  shortest-solution window (moves) the jam must hit
 *  slack      extra moves over the best that still earn 3 stars
 *  newRule    rule card shown before the level ('slide', 'blockers', 'bigger', 'biggest')
 *  tip        coaching line
 */
class DifficultyTable {
  static bandForClass(cls) { return cls <= 5 ? 'junior' : 'senior'; }

  static recipe(band, index, shift) {
    const list = DifficultyTable.TABLE[band];
    const i = Math.max(0, Math.min(list.length - 1, index + (shift || 0)));
    return Object.assign({ index, recipeIndex: i }, list[i]);
  }

  static count(band) { return DifficultyTable.TABLE[band].length; }

  /** Row of the gate (and of the school van) for a lot size. */
  static gateRow(size) { return size <= 6 ? 2 : 3; }
}

DifficultyTable.TABLE = {
  junior: [
    { size: 6, vehicles: 3, blockers: 0, minMoves: 2, maxMoves: 3, slack: 1, newRule: 'slide', tip: 'Swipe a vehicle, or tap it, then tap a glowing spot. Clear the way for the school van!' },
    { size: 6, vehicles: 4, blockers: 0, minMoves: 3, maxMoves: 4, slack: 1, newRule: null, tip: 'Vehicles only move forward or back, never sideways.' },
    { size: 6, vehicles: 5, blockers: 0, minMoves: 4, maxMoves: 5, slack: 1, newRule: null, tip: 'Which vehicle is blocking the van? Move that one first.' },
    { size: 6, vehicles: 6, blockers: 0, minMoves: 5, maxMoves: 6, slack: 2, newRule: null, tip: 'Sometimes you must move a vehicle out of the way of the blocker.' },
    { size: 6, vehicles: 7, blockers: 1, minMoves: 6, maxMoves: 7, slack: 2, newRule: 'blockers', tip: 'Cows, carts and barricades never move. Plan around them!' },
    { size: 6, vehicles: 8, blockers: 1, minMoves: 7, maxMoves: 8, slack: 2, newRule: null, tip: 'Buses and trucks are long. Plan where they can go.' },
    { size: 6, vehicles: 9, blockers: 1, minMoves: 8, maxMoves: 9, slack: 2, newRule: null, tip: 'Think two moves ahead before you swipe.' },
    { size: 7, vehicles: 12, blockers: 2, minMoves: 9, maxMoves: 11, slack: 3, newRule: 'bigger', tip: 'A bigger lot and more traffic! Find the chain of blockers.' },
    { size: 7, vehicles: 13, blockers: 2, minMoves: 10, maxMoves: 12, slack: 3, newRule: null, tip: 'Work backwards: what has to move for the van to go?' },
    { size: 7, vehicles: 14, blockers: 2, minMoves: 12, maxMoves: 15, slack: 3, newRule: null, tip: 'Final jam! Get the school van out.' }
  ],
  senior: [
    { size: 6, vehicles: 8, blockers: 0, minMoves: 7, maxMoves: 8, slack: 2, newRule: 'slide', tip: 'Swipe a vehicle, or tap it, then tap a glowing spot. Free the van in as few moves as you can.' },
    { size: 6, vehicles: 9, blockers: 1, minMoves: 9, maxMoves: 10, slack: 2, newRule: 'blockers', tip: 'Cows, carts and barricades never move. Plan around them.' },
    { size: 6, vehicles: 10, blockers: 1, minMoves: 11, maxMoves: 12, slack: 3, newRule: null, tip: 'A move that looks useless may free a bus later.' },
    { size: 6, vehicles: 11, blockers: 1, minMoves: 13, maxMoves: 15, slack: 3, newRule: null, tip: 'Long chains of blockers. Keep the whole lot in mind.' },
    { size: 7, vehicles: 14, blockers: 2, minMoves: 14, maxMoves: 16, slack: 3, newRule: 'bigger', tip: 'A 7×7 lot. More lanes, more traffic.' },
    { size: 7, vehicles: 15, blockers: 2, minMoves: 16, maxMoves: 18, slack: 4, newRule: null, tip: 'Rush hour. Do not undo your own good moves.' },
    { size: 7, vehicles: 16, blockers: 3, minMoves: 18, maxMoves: 21, slack: 4, newRule: null, tip: 'Plan, then swipe. Every move counts.' },
    { size: 8, vehicles: 22, blockers: 5, minMoves: 16, maxMoves: 21, slack: 4, newRule: 'biggest', tip: 'The biggest lot: 8×8! Some vehicles must move twice.' },
    { size: 8, vehicles: 23, blockers: 5, minMoves: 18, maxMoves: 25, slack: 5, newRule: null, tip: 'Expert jam. Look for the one move that opens everything.' },
    { size: 8, vehicles: 23, blockers: 6, minMoves: 21, maxMoves: 34, slack: 5, newRule: null, tip: 'Final jam! The hardest morning at the gate.' }
  ]
};

if (typeof module !== 'undefined') module.exports = DifficultyTable;
