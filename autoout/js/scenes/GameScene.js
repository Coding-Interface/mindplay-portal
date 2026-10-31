/**
 * GameScene
 * Plays 10 traffic jams picked from the level bank. The lot is 6×6 at first;
 * the last levels use 7×7 and 8×8 lots with more vehicles and blockers.
 *
 * Swipe a vehicle (or tap it, then tap where it should go, or use the arrow
 * keys) and it drives along its lane: see VehicleControls. A slide of any
 * length is one move. Cows, barricades and sabzi carts never move.
 * The level is solved when the school van reaches the gate on the right:
 * the gate swings open and the van drives into school.
 *
 * Sounds: a whoosh for a swipe, engine and exhaust as a vehicle pulls away,
 * a tyre screech as it brakes, a thud when it can't go that way, that vehicle's own horn when it can't move at all, a moo /
 * clank / cart bell for blockers, the constable's whistle for hints, and the
 * van's horn plus the school bell on a win. A street ambience loops.
 */
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.classLevel = data.classLevel || 4;
    this.band = DifficultyTable.bandForClass(this.classLevel);
    this.mode = data.mode || 'fixed';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H).setDepth(-5);

    this.bank = this.registry.get('bank');
    this.storage = this.registry.get('storage');
    this.sfx = this.registry.get('sfx');
    this.sfx.startAmbience();
    this.sessionId = SeededRandom.randomSeedString();
    this.total = GameConfig.LEVELS_PER_SESSION;
    this.picker = new LevelPicker(this.bank, this.band, this.storage, this.sessionId);
    this.difficulty = new DifficultyManager(this.mode);
    this.metrics = new MetricsTracker({
      sessionId: this.sessionId, classLevel: this.classLevel, band: this.band, mode: this.mode,
      theme: 'autoout', bankVersion: this.bank.version
    }, this.storage);

    this.lot = new LotView(this);
    this.hud = new HudBar(this, this.total);
    this.cop = new CopTip(this);
    this.createButtons();
    this.controls = new VehicleControls(this);
    this.levelIndex = 0;
    this.starsTotal = 0;
    this.sprites = [];
    this.panel = null;
    this.ruleCard = null;
    this.startLevel();
  }

  createButtons() {
    const C = GameConfig.COLORS;
    const W = this.scale.width;
    const y = 676;
    const dark = { width: 170, height: 60, fill: C.btnDark, shade: C.btnDarkShade, color: '#ffffff', fontSize: 26 };
    this.undoBtn = new TextButton(this, W / 2 - 330, y, 'Undo', () => this.undo(), dark);
    this.restartBtn = new TextButton(this, W / 2 - 145, y, 'Restart', () => this.restart(), dark);
    this.hintBtn = new TextButton(this, W / 2 + 40, y, 'Hint', () => this.hint(), Object.assign({}, dark, { fill: C.accent, shade: C.accentDark, color: '#1d2a33' }));
    this.skipBtn = new TextButton(this, W / 2 + 225, y, 'Skip', () => this.skip(), dark);
    new TextButton(this, 70, y, 'Menu', () => this.scene.start('MenuScene'), Object.assign({}, dark, { width: 110, height: 52, fontSize: 22 }));
    this.muteBtn = new TextButton(this, W - 90, y, this.sfx.muted ? 'Sound: off' : 'Sound: on', () => {
      this.sfx.setMuted(!this.sfx.muted);
      this.muteBtn.setLabel(this.sfx.muted ? 'Sound: off' : 'Sound: on');
      this.sfx.tap();
    }, Object.assign({}, dark, { width: 150, height: 52, fontSize: 20 }));
    [this.undoBtn, this.restartBtn, this.hintBtn, this.skipBtn].forEach(b => b.setDepth(30));
  }

  // ---------------------------------------------------------------- levels

  startLevel() {
    const slot = this.difficulty.slotFor(this.levelIndex, this.picker.slotCount());
    this.record = this.picker.pick(slot);
    this.recipe = DifficultyTable.recipe(this.band, slot);
    this.board = JamBoard.fromLevel(this.record);
    const B = GameConfig.boardFor(this.record.size);
    if (this.record.gateRow !== undefined) B.gateRow = this.record.gateRow;
    this.B = B;
    this.undoStack = [];
    this.busy = false;
    this.attemptMoves = 0;
    this.controls.reset();

    this.metrics.beginLevel(this.levelIndex + 1, this.record, slot);
    this.hud.setLevel(this.levelIndex, this.total, this.metrics.session.levels);
    this.hud.setStars(this.starsTotal);
    this.cop.say(this.recipe.tip);
    this.skipBtn.setVisible(false);
    this.updateMoves();
    this.lot.build(B);
    this.buildVehicles();

    if (this.recipe.newRule && this.levelIndex === slot) {
      this.busy = true;
      this.ruleCard = new RuleCard(this, this.recipe.newRule, () => {
        this.ruleCard = null;
        this.busy = false;
        this.metrics.levelStart = performance.now();
      });
    }
  }

  buildVehicles() {
    this.sprites.forEach(s => s.destroy());
    this.sprites = this.board.vehicles.map((v, i) => {
      const s = new VehicleSprite(this, v, this.board.pos[i], this.B);
      s.setDepth(this.restDepth(v));
      s.setAlpha(0);
      this.tweens.add({ targets: s, alpha: 1, duration: 220, delay: i * 18 });
      return s;
    });
  }

  restDepth(v) {
    return v.id === 0 ? 12 : (v.fixed ? 9 : 10);
  }

  // ---------------------------------------------------------------- feedback (called by VehicleControls)

  /** Cows, barricades and carts just make their sound. */
  tapBlocker(sp) {
    const v = sp.vehicle;
    this.sfx.blocker(v.kind);
    sp.say(VehicleSprite.SAYS[v.kind] || '!');
    sp.bump();
    this.cop.say(GameScene.BLOCKER_TIPS[v.kind] || 'That never moves. Plan around it.', true);
  }

  /** Completely boxed in: it honks. */
  boxedIn(sp) {
    const kind = sp.vehicle.kind;
    this.metrics.blocked();
    this.sfx.horn(kind);
    sp.say(VehicleSprite.SAYS[kind] || 'HONK!');
    sp.bump();
    this.cop.say('That one is boxed in. Free its lane first!', true);
  }

  /** Swiped towards something that is in the way. */
  blockedSwipe(sp) {
    this.metrics.blocked();
    this.sfx.bump();
    this.sfx.horn(sp.vehicle.kind, 0.45);
    sp.bump();
    this.cop.say('Something is in the way. Try the other direction, or move the blocker first.', true);
  }

  /** Swiped sideways across its lane. */
  wrongWay(sp) {
    sp.bump();
    this.sfx.bump();
    this.cop.say(sp.vehicle.horiz ? 'This one only drives left and right.' : 'This one only drives up and down.', true);
  }

  /** Apply a slide (from swipe, tap, keyboard or the test hooks) and drive the vehicle there. */
  commitMove(id, delta) {
    const before = this.board.clone();
    if (!this.board.move(id, delta)) {
      this.sprites[id].placeAt(this.board.pos[id]);
      return false;
    }
    this.controls.reset();
    this.undoStack.push(before);
    this.metrics.move();
    this.attemptMoves++;
    this.updateMoves();
    const s = this.sprites[id];
    this.sfx.engine(s.vehicle.kind);
    this.busy = true;
    s.setDepth(20);
    s.driveTo(this.board.pos[id], cells => this.sfx.brake(cells), () => {
      s.setDepth(this.restDepth(s.vehicle));
      this.busy = false;
      this.clearHint();
      if (this.board.isSolved()) this.levelSolved();
      else this.cop.say(this.recipe.tip);
    });
    return true;
  }

  undo() {
    if (this.busy || !this.undoStack.length) return;
    this.controls.reset();
    this.board = this.undoStack.pop();
    this.metrics.undo();
    this.sfx.tap();
    this.updateMoves();
    this.syncAll();
  }

  restart() {
    if (this.busy) return;
    this.controls.reset();
    this.board = JamBoard.fromLevel(this.record);
    this.undoStack = [];
    this.attemptMoves = 0;
    this.metrics.restart();
    this.sfx.tap();
    this.cop.say(this.recipe.tip);
    this.updateMoves();
    this.syncAll();
    this.offerSkip();
  }

  syncAll() {
    this.clearHint();
    this.sprites.forEach((s, i) => s.slideTo(this.board.pos[i]));
  }

  hint() {
    if (this.busy) return;
    const res = JamSolver.solve(this.board, 400000);
    this.metrics.hint();
    if (!res.solvable || !res.moves.length) {
      this.cop.say('Hmm, even I am stuck. Try Restart.', true);
      return;
    }
    const m = res.moves[0];
    this.sfx.whistle();
    this.clearHint();
    // select the vehicle in green and preview its best move: Enter or a tap on the lane drives it
    this.controls.showHint(this.sprites[m.id], m.delta);
    this.cop.say('Wheeet! Drive the green vehicle to the faded spot. Swipe it, or tap the spot.');
  }

  clearHint() {
    // the hint lives in the controls' selection, which every move or cancel clears
  }

  offerSkip() {
    const m = this.metrics.current;
    if (m && m.restarts >= 3) this.skipBtn.setVisible(true);
  }

  skip() {
    if (this.busy) return;
    this.controls.reset();
    const result = this.metrics.endLevel({ solved: false, skipped: true, stars: 0 });
    this.difficulty.update(result);
    this.showComplete(result);
  }

  updateMoves() {
    this.hud.setMoves(this.attemptMoves, this.record.optimal);
    this.undoBtn.setEnabled(this.undoStack && this.undoStack.length > 0);
  }

  // ---------------------------------------------------------------- results

  levelSolved() {
    const m = this.metrics.current;
    const best = this.record.optimal;
    const slack = this.recipe.slack;
    let stars = 1;
    if (m.hints === 0 && m.moves <= best + slack) stars = 3;
    else if (m.hints === 0 && m.moves <= Math.ceil(best * 1.5) + slack) stars = 2;
    this.starsTotal += stars;
    this.hud.setStars(this.starsTotal);
    const result = this.metrics.endLevel({ solved: true, stars });
    this.difficulty.update(result);
    this.busy = true;
    this.cop.say(['Free at last!', 'Well driven!', 'Perfect plan! Shabaash!'][stars - 1]);

    // the gate opens, the van honks and drives into school
    const van = this.sprites[0];
    this.sfx.play('clank', 0.5);
    this.lot.openGate();
    this.sfx.horn('van', 0.8);
    van.say(VehicleSprite.SAYS.van);
    van.setDepth(16);
    this.time.delayedCall(350, () => {
      this.sfx.engine('van');
      van.puff(4);
      this.tweens.add({
        targets: van, x: GameConfig.SCENE.campus.x + 70, duration: 900, ease: 'Quad.easeIn',
        onComplete: () => {
          this.sfx.bell();
          this.tweens.add({ targets: van, alpha: 0, duration: 400 });
          this.time.delayedCall(450, () => { this.sfx.win(); this.showComplete(result); });
        }
      });
    });
  }

  showComplete(result) {
    this.busy = true;
    const isLast = this.levelIndex >= this.total - 1;
    this.panel = new LevelCompletePanel(this, result, isLast, () => {
      this.panel = null;
      if (isLast) {
        const session = this.metrics.finish();
        this.scene.start('SummaryScene', { session, classLevel: this.classLevel, mode: this.mode });
      } else {
        this.levelIndex++;
        this.startLevel();
      }
    });
  }
}

/** What the constable says when a blocker is tapped. */
GameScene.BLOCKER_TIPS = {
  cow: 'The cow is resting. She will not move. Go around her!',
  barricade: 'Police barricade. It stays right there.',
  cart: 'The sabzi wala has parked. That cart is not moving.'
};
