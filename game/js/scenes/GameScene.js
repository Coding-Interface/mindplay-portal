/**
 * GameScene
 * Plays a session of 10 levels picked from the level bank, dressed in the
 * active theme (see js/themes).
 *
 * Controls
 *  - Tap a piece, then tap an arrow (or swipe on the piece).
 *  - Keyboard: Tab = next piece, arrow keys = slide, U = undo, R = restart, H = hint.
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
    this.theme = ThemeRegistry.current;
    this.theme.addBackground(this, 0.12);
    this.theme.addAmbience(this);

    this.bank = this.registry.get('bank');
    this.storage = this.registry.get('storage');
    this.sound = this.registry.get('sound');

    this.sessionId = SeededRandom.randomSeedString();
    this.total = GameConfig.LEVELS_PER_SESSION;
    this.picker = new LevelPicker(this.bank, this.band, this.storage, this.sessionId);
    this.difficulty = new DifficultyManager(this.mode);
    this.metrics = new MetricsTracker({
      sessionId: this.sessionId,
      classLevel: this.classLevel,
      band: this.band,
      mode: this.mode,
      theme: this.theme.id,
      bankVersion: this.bank.version
    }, this.storage);

    this.hud = new HudBar(this, this.total, this.theme);
    this.arrowPad = new ArrowPad(this, dir => this.tryMove(dir));
    this.createButtons();
    this.createKeyboard();

    this.levelIndex = 0;
    this.starsTotal = 0;
    this.boardObjects = [];
    this.panel = null;
    this.startLevel();
  }

  // ---------------------------------------------------------------- setup

  createButtons() {
    const y = 664;
    const W = this.scale.width;
    const dark = this.theme.darkButton({ width: 180 });
    this.undoBtn = new TextButton(this, W / 2 - 300, y, 'Undo', () => this.undo(), dark);
    this.restartBtn = new TextButton(this, W / 2 - 100, y, 'Restart', () => this.restart(), dark);
    this.hintBtn = new TextButton(this, W / 2 + 100, y, 'Hint', () => this.hint(), { width: 180 });
    this.skipBtn = new TextButton(this, W / 2 + 300, y, 'Skip', () => this.skip(), dark);
    this.menuBtn = new TextButton(this, 70, y, 'Menu', () => this.scene.start('MenuScene'),
      this.theme.darkButton({ width: 110, height: 52, fontSize: 22 }));
  }

  createKeyboard() {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.on('keydown', ev => {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (map[ev.key]) {
        if (this.selectedId === null) this.selectNext();
        this.tryMove(map[ev.key]);
      } else if (ev.key === 'Tab') {
        ev.preventDefault();
        this.selectNext();
      } else if (ev.key === 'u' || ev.key === 'U') this.undo();
      else if (ev.key === 'r' || ev.key === 'R') this.restart();
      else if (ev.key === 'h' || ev.key === 'H') this.hint();
    });
  }

  // ---------------------------------------------------------------- levels

  startLevel() {
    const slot = this.difficulty.slotFor(this.levelIndex, this.picker.slotCount());
    this.record = this.picker.pick(slot);
    this.recipe = DifficultyTable.recipe(this.band, slot);
    this.tipText = this.theme.say(this.recipe.tip);
    this.layout = new PuzzleLayout(this.record);
    this.state = new BoardState(this.layout);
    this.undoStack = [];
    this.selectedId = null;
    this.busy = false;
    this.stuck = false;
    this.attemptMoves = 0;

    this.metrics.beginLevel(this.levelIndex + 1, this.record, slot);
    this.hud.setLevel(this.levelIndex, this.total, this.metrics.session.levels);
    this.hud.setStars(this.starsTotal);
    this.hud.setTip(this.tipText);
    this.skipBtn.setVisible(false);
    this.updateMoves();
    this.buildBoard();
    this.showIntro();
  }

  buildBoard() {
    this.boardObjects.forEach(o => o.destroy());
    this.boardObjects = [];
    this.crates = {};
    this.holeSprites = [];
    this.arrowPad.hide();

    const T = this.theme;
    const B = GameConfig.BOARD;
    const L = this.layout;
    this.cell = Math.min(B.maxCell, Math.floor(B.maxW / L.cols), Math.floor(B.maxH / L.rows));
    this.originX = B.x - (L.cols * this.cell) / 2;
    this.originY = B.y - (L.rows * this.cell) / 2;
    this.boardRect = { x: this.originX, y: this.originY, w: L.cols * this.cell, h: L.rows * this.cell };

    this.boardObjects.push(T.drawBoardFrame(this, this.boardRect));

    T.drawGround(this, this.boardRect, this.cell, L.cols, L.rows).forEach((o, i) => {
      if (i === 0 || !T.has(this, 'ground')) {
        o.setInteractive();
        o.on('pointerup', () => this.deselect());
      }
      this.boardObjects.push(o);
    });

    const decor = T.drawBoardDecor(this, this.boardRect);
    if (decor) this.boardObjects.push(decor);

    L.walls.forEach(i => {
      const p = this.cellCenter(i);
      this.boardObjects.push(this.add.image(p.x, p.y, T.wallKey(i)).setDisplaySize(this.cell * 1.02, this.cell * 1.02));
    });

    L.holes.forEach((h, hi) => {
      const p = this.cellCenter(h.idx);
      const s = this.add.image(p.x, p.y, T.key('hole' + h.color)).setDisplaySize(this.cell * 1.0, this.cell * 1.0);
      this.holeSprites[hi] = s;
      this.boardObjects.push(s);
    });

    this.state.boxes.forEach(b => {
      const p = this.cellCenter(b.idx);
      const crate = new CrateSprite(this, p.x, p.y, b, this.cell, T);
      crate.setDepth(20);
      this.attachCrateInput(crate);
      this.crates[b.id] = crate;
      this.boardObjects.push(crate);
      crate.setScale(0);
      this.tweens.add({ targets: crate, scale: 1, duration: 300, delay: 60 * b.id, ease: 'Back.easeOut' });
    });

    // auto-select when there is only one piece (first levels)
    if (this.state.boxes.length === 1) this.select(this.state.boxes[0].id, true);
  }

  /** Short story banner over the board at level start. */
  showIntro() {
    const r = this.boardRect;
    const t = this.add.text(r.x + r.w / 2, r.y + r.h / 2, this.theme.levelIntro(this.record.optimal), {
      fontFamily: GameConfig.FONT, fontSize: '28px', color: '#ffffff', fontStyle: '700', align: 'center',
      backgroundColor: 'rgba(0,0,0,0.72)', padding: { x: 20, y: 12 },
      wordWrap: { width: Math.max(320, r.w - 40) }
    }).setOrigin(0.5).setDepth(70).setAlpha(0);
    this.boardObjects.push(t);
    this.tweens.add({ targets: t, alpha: 1, duration: 250, delay: 250 });
    this.tweens.add({ targets: t, alpha: 0, duration: 400, delay: 2100, onComplete: () => t.setVisible(false) });
    // the banner never blocks play: it ignores input
  }

  attachCrateInput(crate) {
    crate.on('pointerdown', pointer => {
      this.swipeStart = { x: pointer.x, y: pointer.y, id: crate.boxId };
    });
    crate.on('pointerup', pointer => {
      const s = this.swipeStart;
      this.swipeStart = null;
      if (!s || s.id !== crate.boxId) return;
      const dx = pointer.x - s.x;
      const dy = pointer.y - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > this.cell * 0.35) {
        this.select(crate.boxId, true);
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        this.tryMove(dir);
      } else {
        this.select(crate.boxId);
      }
    });
  }

  cellCenter(idx) {
    return {
      x: this.originX + (this.layout.col(idx) + 0.5) * this.cell,
      y: this.originY + (this.layout.row(idx) + 0.5) * this.cell
    };
  }

  // ---------------------------------------------------------------- selection

  select(id, silent) {
    if (this.busy) return;
    const box = this.state.getBox(id);
    if (!box || !box.alive) return;
    if (this.selectedId !== null && this.crates[this.selectedId]) this.crates[this.selectedId].setSelected(false);
    this.selectedId = id;
    this.crates[id].setSelected(true);
    if (!silent) this.sound.tap();
    this.showArrows();
  }

  selectNext() {
    const alive = this.state.boxes.filter(b => b.alive);
    if (!alive.length) return;
    const i = alive.findIndex(b => b.id === this.selectedId);
    this.select(alive[(i + 1) % alive.length].id);
  }

  deselect() {
    if (this.selectedId !== null && this.crates[this.selectedId]) this.crates[this.selectedId].setSelected(false);
    this.selectedId = null;
    this.arrowPad.hide();
  }

  showArrows() {
    if (this.selectedId === null) return this.arrowPad.hide();
    const box = this.state.getBox(this.selectedId);
    const dirs = PuzzleLayout.DIR_NAMES.filter(d => this.state.simulate(box.id, d));
    this.arrowPad.show(this.cellCenter(box.idx), this.cell, dirs);
  }

  // ---------------------------------------------------------------- moves

  tryMove(dir) {
    if (this.busy || this.selectedId === null) return;
    const id = this.selectedId;
    const sim = this.state.simulate(id, dir);
    if (!sim) {
      this.metrics.blocked();
      this.sound.blocked();
      this.crates[id].nudge(dir);
      return;
    }

    this.undoStack.push(this.state.clone());
    this.state.apply(id, dir);
    this.metrics.move();
    this.attemptMoves++;
    this.updateMoves();
    this.arrowPad.hide();
    this.busy = true;
    this.sound.slide();

    const crate = this.crates[id];
    const points = sim.path.map(i => this.cellCenter(i));
    this.theme.onSlide(this, points, this.cell);
    crate.slideAlong(points, () => {
      if (sim.holeIndex >= 0) {
        this.sound.drop();
        crate.setSelected(false);
        crate.dropIn(() => {
          crate.setVisible(false);
          this.holeSprites[sim.holeIndex].setTexture(this.theme.key('filled' + crate.color));
          this.burst(points[points.length - 1]);
          this.afterMove();
        });
        this.selectedId = null;
      } else {
        this.sound.bump();
        this.afterMove();
      }
    });
  }

  afterMove() {
    this.busy = false;
    if (this.state.isSolved()) {
      this.levelSolved();
      return;
    }
    this.checkStuck();
    if (this.selectedId !== null) this.showArrows();
    else {
      // keep play flowing: if only one piece is left, select it
      const alive = this.state.boxes.filter(b => b.alive);
      if (alive.length === 1) this.select(alive[0].id, true);
    }
  }

  checkStuck() {
    const res = PuzzleSolver.solve(this.state, 25000);
    const wasStuck = this.stuck;
    this.stuck = res.complete && !res.solvable;
    if (this.stuck && !wasStuck) {
      this.metrics.deadEnd();
      this.sound.stuck();
      this.hud.setTip(this.theme.say('Oh no, the {holes} cannot all be filled now. Undo or Restart.'), true);
      this.undoBtn.pulse();
      this.offerSkip();
    } else if (!this.stuck && wasStuck) {
      this.hud.setTip(this.tipText);
    }
  }

  undo() {
    if (this.busy || !this.undoStack.length) return;
    this.state = this.undoStack.pop();
    this.metrics.undo();
    this.sound.tap();
    this.updateMoves();
    this.syncBoard();
    this.checkStuck();
  }

  restart() {
    if (this.busy) return;
    this.state = new BoardState(this.layout);
    this.undoStack = [];
    this.attemptMoves = 0;
    this.metrics.restart();
    this.sound.tap();
    this.stuck = false;
    this.hud.setTip(this.tipText);
    this.updateMoves();
    this.syncBoard();
    this.offerSkip();
  }

  /** Put every sprite where the state says, after undo/restart. */
  syncBoard() {
    this.deselect();
    this.layout.holes.forEach((h, hi) => {
      if (this.state.isHoleOpen(hi)) this.holeSprites[hi].setTexture(this.theme.key('hole' + h.color));
    });
    this.state.boxes.forEach(b => {
      const c = this.crates[b.id];
      if (b.alive) {
        const p = this.cellCenter(b.idx);
        c.setVisible(true).setAlpha(1).setScale(1).setPosition(p.x, p.y);
        c.setInteractive({ useHandCursor: true });
      } else {
        c.setVisible(false);
      }
    });
  }

  hint() {
    if (this.busy) return;
    const res = PuzzleSolver.solve(this.state, 40000);
    this.metrics.hint();
    if (!res.solvable) {
      this.hud.setTip('No way forward from here. Try Undo or Restart.', true);
      this.undoBtn.pulse();
      return;
    }
    const mv = res.moves[0];
    this.sound.hint();
    this.select(mv.boxId, true);
    this.crates[mv.boxId].wiggle();
    this.arrowPad.highlight(mv.dir);
    this.hud.setTip(this.theme.say('Try this {crate}, in the glowing direction.'));
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
    let stars = 1;
    if (m.hints === 0 && m.moves <= this.record.optimal) stars = 3;
    else if (m.hints === 0 && m.moves <= this.record.optimal + this.recipe.slack) stars = 2;
    this.starsTotal += stars;
    this.hud.setStars(this.starsTotal);
    this.sound.win();
    const result = this.metrics.endLevel({ solved: true, stars });
    this.difficulty.update(result);
    this.busy = true;
    this.deselect();
    this.theme.playWin(this, this.boardRect, () => this.showComplete(result));
  }

  showComplete(result) {
    this.busy = true;
    const isLast = this.levelIndex >= this.total - 1;
    this.panel = new LevelCompletePanel(this, result, isLast, this.theme, () => {
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

  burst(p) {
    const em = this.add.particles(p.x, p.y, 'spark', {
      speed: { min: 80, max: 240 },
      scale: { start: 0.18, end: 0 },
      lifespan: 500,
      quantity: 14,
      tint: [0xffd23f, 0xffffff, 0x9be15d],
      emitting: false
    }).setDepth(40);
    em.explode(14);
    this.time.delayedCall(700, () => em.destroy());
  }
}
