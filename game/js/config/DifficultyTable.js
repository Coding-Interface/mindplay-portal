/**
 * DifficultyTable
 * One fixed curve of 10 levels per grade band. Every session generates new
 * puzzles, but level N always uses the same recipe, so difficulty is
 * comparable across children and across replays.
 *
 * Recipe fields:
 *  cols, rows     board size
 *  holes          holes to fill
 *  decoys         extra boxes not needed for the solution (distractors)
 *  walls          wall blocks placed on the board
 *  colors         0 = plain boxes; 2 = two colours that must match their hole
 *  minMoves/maxMoves  shortest-solution length window the puzzle must hit
 *  slack          extra moves over the shortest solution still worth 2 stars
 *  tip            one-line coaching text shown at level start; {crate}, {Holes},
 *                 {colorRule} etc. are filled in by the active theme (BaseTheme.say)
 */
class DifficultyTable {
  static bands() {
    return {
      junior: { label: 'Class 3–5', classes: [3, 4, 5] },
      senior: { label: 'Class 6–8', classes: [6, 7, 8] }
    };
  }

  static bandForClass(cls) {
    return cls <= 5 ? 'junior' : 'senior';
  }

  static levels(band) {
    return DifficultyTable.TABLE[band];
  }

  static recipe(band, levelIndex, shift) {
    const list = DifficultyTable.TABLE[band];
    const i = Math.max(0, Math.min(list.length - 1, levelIndex + (shift || 0)));
    return Object.assign({ levelIndex, recipeIndex: i }, list[i]);
  }
}

DifficultyTable.TABLE = {
  junior: [
    { cols: 5, rows: 5, holes: 1, decoys: 0, walls: 0, colors: 0, minMoves: 1, maxMoves: 1, slack: 1, tip: 'Tap a {crate}, then tap an arrow to slide it into the {hole}.' },
    { cols: 5, rows: 5, holes: 2, decoys: 0, walls: 0, colors: 0, minMoves: 2, maxMoves: 2, slack: 1, tip: 'Two {holes} this time. {Crates} stop when they hit something.' },
    { cols: 6, rows: 5, holes: 2, decoys: 0, walls: 1, colors: 0, minMoves: 2, maxMoves: 3, slack: 1, tip: '{Walls} stop a sliding {crate}. Use them!' },
    { cols: 6, rows: 5, holes: 2, decoys: 0, walls: 1, colors: 0, minMoves: 2, maxMoves: 4, slack: 2, tip: 'Order matters! Think before your first move.' },
    { cols: 6, rows: 5, holes: 3, decoys: 0, walls: 1, colors: 0, minMoves: 3, maxMoves: 4, slack: 2, tip: 'A filled {hole} is flat again. {Crates} can slide over it.' },
    { cols: 6, rows: 6, holes: 3, decoys: 0, walls: 2, colors: 0, minMoves: 3, maxMoves: 5, slack: 2, tip: 'Plan the whole path in your head first.' },
    { cols: 6, rows: 6, holes: 3, decoys: 1, walls: 2, colors: 0, minMoves: 3, maxMoves: 5, slack: 2, tip: 'One {crate} is extra. You do not need every {crate}.' },
    { cols: 7, rows: 6, holes: 3, decoys: 0, walls: 2, colors: 0, minMoves: 4, maxMoves: 6, slack: 2, tip: 'Some {crates} must move twice. Find the stopper.' },
    { cols: 7, rows: 6, holes: 4, decoys: 0, walls: 2, colors: 0, minMoves: 4, maxMoves: 6, slack: 3, tip: 'Four {holes}. Which one should you fill first?' },
    { cols: 7, rows: 6, holes: 4, decoys: 1, walls: 3, colors: 0, minMoves: 5, maxMoves: 7, slack: 3, tip: 'Final level! Plan carefully.' }
  ],
  senior: [
    { cols: 6, rows: 5, holes: 2, decoys: 0, walls: 1, colors: 0, minMoves: 2, maxMoves: 3, slack: 1, tip: 'Tap a {crate}, then an arrow. Fill every {hole}.' },
    { cols: 6, rows: 6, holes: 3, decoys: 0, walls: 1, colors: 0, minMoves: 3, maxMoves: 4, slack: 1, tip: '{Crates} stop at {walls}, other {crates} and edges. Filled {holes} are flat.' },
    { cols: 7, rows: 6, holes: 3, decoys: 0, walls: 2, colors: 0, minMoves: 3, maxMoves: 5, slack: 2, tip: 'Plan the order of your moves before the first one.' },
    { cols: 7, rows: 6, holes: 4, decoys: 0, walls: 2, colors: 0, minMoves: 4, maxMoves: 6, slack: 2, tip: 'Try to match the best move count.' },
    { cols: 7, rows: 6, holes: 3, decoys: 0, walls: 2, colors: 2, minMoves: 3, maxMoves: 5, slack: 2, tip: '{colorRule}' },
    { cols: 7, rows: 6, holes: 4, decoys: 0, walls: 2, colors: 2, minMoves: 4, maxMoves: 6, slack: 2, tip: '{colorPass}' },
    { cols: 7, rows: 7, holes: 4, decoys: 1, walls: 2, colors: 2, minMoves: 4, maxMoves: 7, slack: 2, tip: 'One {crate} is a decoy. Work out which one.' },
    { cols: 8, rows: 7, holes: 4, decoys: 0, walls: 3, colors: 2, minMoves: 5, maxMoves: 8, slack: 3, tip: 'Long plan ahead. Picture each slide before you tap.' },
    { cols: 8, rows: 7, holes: 4, decoys: 1, walls: 3, colors: 2, minMoves: 5, maxMoves: 8, slack: 3, tip: 'A decoy and two colours. Order is everything.' },
    { cols: 8, rows: 7, holes: 4, decoys: 1, walls: 4, colors: 2, minMoves: 6, maxMoves: 9, slack: 3, tip: 'Final level! Make every move count.' }
  ]
};

if (typeof module !== 'undefined') module.exports = DifficultyTable;
