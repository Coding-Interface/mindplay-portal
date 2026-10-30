/**
 * DifficultyTable
 * One fixed 10-level curve per grade band. Every session draws new puzzles
 * from the bank, but level N always uses the same recipe.
 *
 *  spices     how many different spices (each fills exactly one jar)
 *  capacity   scoops per jar
 *  empties    empty jars to start with
 *  hidden     frosted jars: only the top spice can be seen until it is uncovered
 *  minMoves / maxMoves  shortest-solution window (pours) the puzzle must hit
 *  slack      extra pours over the best that still earn 3 stars
 *  newRule    rule card shown before the level
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
}

DifficultyTable.TABLE = {
  junior: [
    { spices: 2, capacity: 3, empties: 1, hidden: false, minMoves: 3, maxMoves: 5, slack: 1, newRule: 'pour', tip: 'Tap a jar, then tap where to pour. Spice only goes on the same spice.' },
    { spices: 3, capacity: 3, empties: 2, hidden: false, minMoves: 4, maxMoves: 6, slack: 1, newRule: null, tip: 'Empty jars take any spice. Use them to park scoops.' },
    { spices: 3, capacity: 4, empties: 2, hidden: false, minMoves: 5, maxMoves: 8, slack: 2, newRule: null, tip: 'Bigger jars now. Fill each jar with one spice.' },
    { spices: 4, capacity: 3, empties: 2, hidden: false, minMoves: 6, maxMoves: 9, slack: 2, newRule: null, tip: 'Four spices. Think: which jar should be emptied first?' },
    { spices: 4, capacity: 4, empties: 2, hidden: false, minMoves: 8, maxMoves: 11, slack: 2, newRule: null, tip: 'Do not fill both empty jars too early.' },
    { spices: 4, capacity: 4, empties: 2, hidden: false, minMoves: 10, maxMoves: 13, slack: 3, newRule: null, tip: 'Plan a few pours ahead before you start.' },
    { spices: 5, capacity: 3, empties: 2, hidden: false, minMoves: 9, maxMoves: 12, slack: 3, newRule: null, tip: 'Five spices! Finish one jar at a time.' },
    { spices: 5, capacity: 4, empties: 2, hidden: false, minMoves: 12, maxMoves: 14, slack: 3, newRule: null, tip: 'Look for spices that are almost together.' },
    { spices: 5, capacity: 4, empties: 2, hidden: false, minMoves: 14, maxMoves: 16, slack: 3, newRule: null, tip: 'Keep one empty jar free as long as you can.' },
    { spices: 6, capacity: 4, empties: 2, hidden: false, minMoves: 15, maxMoves: 18, slack: 4, newRule: null, tip: 'Final shelf! Sort all six spices.' }
  ],
  senior: [
    { spices: 4, capacity: 4, empties: 2, hidden: false, minMoves: 9, maxMoves: 12, slack: 2, newRule: 'pour', tip: 'Tap a jar, then where to pour. Same spice on same spice, or into an empty jar.' },
    { spices: 5, capacity: 4, empties: 2, hidden: false, minMoves: 13, maxMoves: 15, slack: 3, newRule: null, tip: 'Plan the order. Some pours trap a spice at the bottom.' },
    { spices: 5, capacity: 4, empties: 2, hidden: true, minMoves: 13, maxMoves: 15, slack: 3, newRule: 'hidden', tip: 'Frosted jars: you only see the top spice. Remember what you uncover.' },
    { spices: 6, capacity: 4, empties: 2, hidden: false, minMoves: 16, maxMoves: 18, slack: 3, newRule: null, tip: 'Six spices. Keep an empty jar for emergencies.' },
    { spices: 6, capacity: 4, empties: 2, hidden: true, minMoves: 17, maxMoves: 19, slack: 4, newRule: null, tip: 'Frosted jars again. Uncover, remember, then plan.' },
    { spices: 6, capacity: 4, empties: 2, hidden: true, minMoves: 18, maxMoves: 20, slack: 4, newRule: null, tip: 'Look for the jar that frees the most spice.' },
    { spices: 7, capacity: 4, empties: 2, hidden: false, minMoves: 19, maxMoves: 21, slack: 4, newRule: null, tip: 'Seven spices. Finish jars to clear space.' },
    { spices: 7, capacity: 4, empties: 2, hidden: true, minMoves: 20, maxMoves: 22, slack: 4, newRule: null, tip: 'Hidden layers and seven spices. Stay calm.' },
    { spices: 8, capacity: 4, empties: 2, hidden: false, minMoves: 22, maxMoves: 25, slack: 5, newRule: null, tip: 'The full masala box: eight spices.' },
    { spices: 8, capacity: 4, empties: 2, hidden: true, minMoves: 24, maxMoves: 27, slack: 5, newRule: null, tip: 'Final shelf! Eight spices in frosted jars.' }
  ]
};

if (typeof module !== 'undefined') module.exports = DifficultyTable;
