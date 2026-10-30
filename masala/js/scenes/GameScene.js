/**
 * GameScene
 * Plays 10 shelves picked from the level bank.
 * Tap a jar to pick it up, tap another jar to pour into it.
 * Undo, Restart and Hint are on the bottom bar.
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
    this.sound = this.registry.get('sound');
    this.sessionId = SeededRandom.randomSeedString();
    this.rng = new SeededRandom(this.sessionId + '-spices');
    this.total = GameConfig.LEVELS_PER_SESSION;
    this.picker = new LevelPicker(this.bank, this.band, this.storage, this.sessionId);
    this.difficulty = new DifficultyManager(this.mode);
    this.metrics = new MetricsTracker({
      sessionId: this.sessionId, classLevel: this.classLevel, band: this.band, mode: this.mode,
      theme: 'masala', bankVersion: this.bank.version
    }, this.storage);

    this.hud = new HudBar(this, this.total);
    this.createButtons();
    this.levelIndex = 0;
    this.starsTotal = 0;
    this.boardObjects = [];
    this.panel = null;
    this.ruleCard = null;
    this.startLevel();
  }

  createButtons() {
    const C = GameConfig.COLORS;
    const W = this.scale.width;
    const y = 668;
    const dark = { width: 180, fill: C.btnDark, shade: C.btnDarkShade, color: '#ffffff' };
    this.undoBtn = new TextButton(this, W / 2 - 300, y, 'Undo', () => this.undo(), dark);
    this.restartBtn = new TextButton(this, W / 2 - 100, y, 'Restart', () => this.restart(), dark);
    this.hintBtn = new TextButton(this, W / 2 + 100, y, 'Hint', () => this.hint(), { width: 180, fill: C.accent, shade: C.accentDark });
    this.skipBtn = new TextButton(this, W / 2 + 300, y, 'Skip', () => this.skip(), dark);
    new TextButton(this, 70, y, 'Menu', () => this.scene.start('MenuScene'), Object.assign({}, dark, { width: 110, height: 52, fontSize: 22 }));
    [this.undoBtn, this.restartBtn, this.hintBtn, this.skipBtn].forEach(b => b.setDepth(30));
  }

  // ---------------------------------------------------------------- levels

  startLevel() {
    const slot = this.difficulty.slotFor(this.levelIndex, this.picker.slotCount());
    this.record = this.picker.pick(slot);
    this.recipe = DifficultyTable.recipe(this.band, slot);
    // fresh spice set for this shelf
    const order = this.rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
    this.spiceOf = c => order[c.charCodeAt(0) - 97];
    this.keyFor = c => 'scoop_' + SpiceTable.get(this.spiceOf(c)).key;

    this.state = new JarState(this.record.jars, this.record.capacity);
    this.known = this.record.jars.map(() => new Array(this.record.capacity).fill(!this.record.hidden));
    this.updateKnown();
    this.undoStack = [];
    this.selected = null;
    this.busy = false;
    this.stuck = false;
    this.attemptMoves = 0;

    this.metrics.beginLevel(this.levelIndex + 1, this.record, slot);
    this.hud.setLevel(this.levelIndex, this.total, this.metrics.session.levels);
    this.hud.setStars(this.starsTotal);
    this.hud.setTip(this.recipe.tip);
    this.skipBtn.setVisible(false);
    this.updateMoves();
    this.buildShelf();

    if (this.recipe.newRule && this.levelIndex === slot) {
      this.busy = true;
      this.ruleCard = new RuleCard(this, this.recipe.newRule, () => {
        this.ruleCard = null;
        this.busy = false;
        this.metrics.levelStart = performance.now();
      });
    }
  }

  /** Lay the jars out on one or two shelves, scaled to fit. */
  buildShelf() {
    this.boardObjects.forEach(o => o.destroy());
    this.boardObjects = [];
    this.jars = [];
    const A = GameConfig.SHELF_AREA;
    const J = GameConfig.JAR;
    const n = this.state.jars.length;
    const rows = n <= 6 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
    const h = J.heights[this.record.capacity];
    const gap = 26;
    const maxRow = Math.max(...rows);
    const rowGap = 46;
    const areaH = A.bottom - A.top;
    const s = Math.min(1, A.maxRowWidth / (maxRow * (J.w + gap)), (areaH / rows.length - rowGap) / h);
    const rowH = h * s + rowGap;
    const startY = A.top + (areaH - rowH * rows.length) / 2 + 10;
    let idx = 0;
    rows.forEach((count, r) => {
      const y = startY + r * rowH;
      const rowW = count * (J.w + gap) * s;
      const x0 = this.scale.width / 2 - rowW / 2 + (J.w + gap) * s / 2;
      const shelfY = y + (J.top + this.record.capacity * J.scoop + 16) * s;
      const shelf = this.add.tileSprite(this.scale.width / 2, shelfY + 14, rowW + 60, 28, 'shelf').setDepth(1);
      this.boardObjects.push(shelf);
      for (let c = 0; c < count; c++) {
        const jar = new JarSprite(this, x0 + c * (J.w + gap) * s, y, idx, this.record.capacity, s);
        jar.setDepth(10);
        jar.on('pointerup', () => this.tapJar(jar.index));
        this.jars.push(jar);
        this.boardObjects.push(jar);
        idx++;
      }
    });
    this.scaleNow = s;
    this.refreshAll();
  }

  refreshAll() {
    this.jars.forEach((jar, i) => jar.refresh(this.state.jars[i], this.known[i], this.keyFor));
  }

  /** On frosted levels, the top run of every jar becomes visible (and stays visible). */
  updateKnown() {
    this.state.jars.forEach((j, i) => {
      const run = this.state.topRun(i);
      for (let k = j.length - run; k < j.length; k++) this.known[i][k] = true;
    });
  }

  // ---------------------------------------------------------------- input

  tapJar(i) {
    if (this.busy) return;
    if (this.selected === null) {
      if (!this.state.jars[i].length || this.state.isComplete(i)) {
        this.metrics.blocked();
        this.sound.blocked();
        this.jars[i].shake();
        return;
      }
      this.selected = i;
      this.jars[i].setSelected(true);
      this.sound.tap();
      return;
    }
    if (this.selected === i) {
      this.jars[i].setSelected(false);
      this.selected = null;
      return;
    }
    const from = this.selected;
    if (!this.state.pourAmount(from, i)) {
      this.metrics.blocked();
      this.sound.blocked();
      this.jars[i].shake();
      this.hud.setTip('That spice cannot go there. Same spice on same spice, or into an empty jar.', true);
      return;
    }
    this.pour(from, i);
  }

  pour(a, b) {
    const A = this.jars[a];
    const B = this.jars[b];
    const color = SpiceTable.get(this.spiceOf(this.state.top(a))).color;
    this.undoStack.push(this.state.clone());
    this.state.pour(a, b);
    this.metrics.move();
    this.attemptMoves++;
    this.updateMoves();
    this.busy = true;
    this.selected = null;
    A.glow.setStrokeStyle(8, GameConfig.COLORS.accent, 0);
    A.setDepth(50);
    const dir = B.baseX >= A.baseX ? 1 : -1;
    const s = this.scaleNow;
    this.sound.pour();

    this.tweens.add({
      targets: A,
      x: B.baseX - dir * 78 * s,
      y: B.baseY - 150 * s,
      angle: dir * 70,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.stream(A, B, color);
        this.time.delayedCall(140, () => {
          this.updateKnown();
          A.refresh(this.state.jars[a], this.known[a], this.keyFor);
        });
        this.time.delayedCall(300, () => {
          B.refresh(this.state.jars[b], this.known[b], this.keyFor);
          this.tweens.add({
            targets: A, x: A.baseX, y: A.baseY, angle: 0, duration: 260, ease: 'Sine.easeInOut',
            onComplete: () => { A.setDepth(10); this.afterMove(); }
          });
        });
      }
    });
  }

  /** Falling spice between the tilted jar's mouth and the target jar. */
  stream(A, B, colorHex) {
    const tint = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const s = this.scaleNow;
    const x0 = A.x + (B.baseX > A.baseX ? 1 : -1) * 44 * s;
    const y0 = A.y + 30 * s;
    for (let k = 0; k < 26; k++) {
      const d = this.add.image(x0 + (Math.random() - 0.5) * 10, y0, 'dot').setTint(tint).setScale((0.26 + Math.random() * 0.14) * Math.max(0.7, s)).setDepth(60);
      this.tweens.add({
        targets: d, x: B.baseX + (Math.random() - 0.5) * 30 * s, y: B.baseY + 70 * s,
        duration: 280, delay: k * 9, ease: 'Quad.easeIn', onComplete: () => d.destroy()
      });
    }
  }

  afterMove() {
    this.busy = false;
    this.refreshAll();
    if (this.state.isSolved()) {
      this.levelSolved();
      return;
    }
    this.checkStuck();
  }

  checkStuck() {
    const res = SortSolver.solve(this.state, 80000);
    const wasStuck = this.stuck;
    this.stuck = !this.state.anyPour() || (res.complete && !res.solvable);
    if (this.stuck && !wasStuck) {
      this.metrics.deadEnd();
      this.sound.stuck();
      this.hud.setTip('Oh no, the spices cannot all be sorted from here. Undo or Restart.', true);
      this.undoBtn.pulse();
      this.offerSkip();
    } else if (!this.stuck) {
      this.hud.setTip(this.recipe.tip);
    }
  }

  undo() {
    if (this.busy || !this.undoStack.length) return;
    this.clearSelection();
    this.state = this.undoStack.pop();
    this.metrics.undo();
    this.sound.tap();
    this.updateMoves();
    this.refreshAll();
    this.checkStuck();
  }

  restart() {
    if (this.busy) return;
    this.clearSelection();
    this.state = new JarState(this.record.jars, this.record.capacity);
    this.undoStack = [];
    this.attemptMoves = 0;
    this.metrics.restart();
    this.sound.tap();
    this.stuck = false;
    this.hud.setTip(this.recipe.tip);
    this.updateMoves();
    this.refreshAll();
    this.offerSkip();
  }

  hint() {
    if (this.busy) return;
    this.clearSelection();
    const res = SortSolver.solve(this.state, 300000);
    this.metrics.hint();
    if (!res.solvable) {
      this.hud.setTip('No way forward from here. Try Undo or Restart.', true);
      this.undoBtn.pulse();
      return;
    }
    const m = res.moves[0];
    this.sound.hint();
    this.jars[m.from].pulse();
    this.time.delayedCall(450, () => this.jars[m.to].pulse());
    this.hud.setTip('Try pouring from the first glowing jar into the second one.');
  }

  clearSelection() {
    if (this.selected !== null) this.jars[this.selected].setSelected(false);
    this.selected = null;
  }

  offerSkip() {
    const m = this.metrics.current;
    if (m && (m.restarts >= 3 || m.deadEnds >= 3)) this.skipBtn.setVisible(true);
  }

  skip() {
    if (this.busy) return;
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
    this.sound.win();
    const result = this.metrics.endLevel({ solved: true, stars });
    this.difficulty.update(result);
    this.busy = true;
    // the finished jars hop one after another
    const full = this.jars.filter((j, i) => this.state.jars[i].length);
    full.forEach((j, k) => this.tweens.add({ targets: j, y: j.baseY - 22, duration: 160, yoyo: true, delay: k * 90 }));
    this.time.delayedCall(300 + full.length * 90, () => this.showComplete(result));
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
