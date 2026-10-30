/**
 * GameScene
 * Plays 10 traffic jams picked from the level bank. The lot is 6×6 at first;
 * the last levels use 7×7 and 8×8 lots with more vehicles and blockers.
 *
 * Drag a vehicle along its lane; it snaps to whole cells. A slide of any
 * length is one move. Cows, barricades and sabzi carts never move.
 * The level is solved when the school van reaches the gate on the right:
 * the gate swings open and the van drives into school.
 *
 * Sounds: engine and exhaust when a vehicle moves, a thud when it hits
 * something, that vehicle's own horn when it can't move at all, a moo /
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
    this.setupDrag();
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
    this.drag = null;
    this.attemptMoves = 0;

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

  // ---------------------------------------------------------------- dragging

  setupDrag() {
    this.input.on('gameobjectdown', (pointer, obj) => {
      if (this.busy || !(obj instanceof VehicleSprite)) return;
      const v = obj.vehicle;
      if (v.fixed) {
        // blockers just make their sound
        this.sfx.blocker(v.kind);
        obj.say(VehicleSprite.SAYS[v.kind] || '!');
        obj.bump();
        this.cop.say(GameScene.BLOCKER_TIPS[v.kind] || 'That never moves. Plan around it.', true);
        return;
      }
      const r = this.board.range(v.id);
      this.drag = {
        sprite: obj, id: v.id, horiz: v.horiz, start: v.horiz ? obj.x : obj.y,
        pointer0: v.horiz ? pointer.x : pointer.y, back: r.back, fwd: r.fwd, moved: false, hit: false
      };
      obj.setGlow(true, GlowFx.SELECT);
      obj.setLifted(true);
      obj.setDepth(20);
    });
    this.input.on('pointermove', pointer => {
      const d = this.drag;
      if (!d) return;
      const cell = this.B.cell;
      const raw = (d.horiz ? pointer.x : pointer.y) - d.pointer0;
      const off = Math.max(-d.back * cell, Math.min(d.fwd * cell, raw));
      if (Math.abs(off) > 4 && !d.moved) {
        d.moved = true;
        this.sfx.engine(d.sprite.vehicle.kind);
        d.sprite.puff(2);
      }
      // pushed into something: one thud per drag
      if (!d.hit && Math.abs(raw - off) > cell * 0.35 && (d.back + d.fwd) > 0) {
        d.hit = true;
        this.sfx.bump();
      }
      if (d.horiz) d.sprite.x = d.start + off; else d.sprite.y = d.start + off;
    });
    const release = () => {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      d.sprite.setGlow(false);
      d.sprite.setLifted(false);
      d.sprite.setDepth(this.restDepth(d.sprite.vehicle));
      const cell = this.B.cell;
      const now = d.horiz ? d.sprite.x : d.sprite.y;
      const delta = Math.round((now - d.start) / cell);
      if (delta === 0) {
        d.sprite.slideTo(this.board.pos[d.id]);
        if (d.back === 0 && d.fwd === 0) {
          // completely boxed in: it honks
          const kind = d.sprite.vehicle.kind;
          this.metrics.blocked();
          this.sfx.horn(kind);
          d.sprite.say(VehicleSprite.SAYS[kind] || 'HONK!');
          d.sprite.bump();
          this.cop.say('That one is boxed in. Free its lane first!', true);
        }
        return;
      }
      this.commitMove(d.id, delta);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  /** Apply a slide (from a drag, or from the test hooks). */
  commitMove(id, delta) {
    const before = this.board.clone();
    if (!this.board.move(id, delta)) {
      this.sprites[id].placeAt(this.board.pos[id]);
      return false;
    }
    this.undoStack.push(before);
    this.metrics.move();
    this.attemptMoves++;
    this.updateMoves();
    const s = this.sprites[id];
    this.sfx.engine(s.vehicle.kind);
    s.puff(3);
    this.busy = true;
    s.slideTo(this.board.pos[id], () => {
      this.busy = false;
      this.clearHint();
      if (this.board.isSolved()) this.levelSolved();
      else this.cop.say(this.recipe.tip);
    });
    return true;
  }

  undo() {
    if (this.busy || !this.undoStack.length) return;
    this.board = this.undoStack.pop();
    this.metrics.undo();
    this.sfx.tap();
    this.updateMoves();
    this.syncAll();
  }

  restart() {
    if (this.busy) return;
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
    const s = this.sprites[m.id];
    s.setGlow(true, GlowFx.HINT);
    this.hintSprite = s;
    // ghost showing where it should go
    const target = s.centreFor(this.board.pos[m.id] + m.delta);
    const ghost = this.add.image(target.x, target.y, s.vehicle.kind).setAlpha(0.4).setDepth(9);
    ghost.setDisplaySize(s.img.displayWidth, s.img.displayHeight);
    if (!s.vehicle.horiz) ghost.setAngle(90);
    this.hintGhost = ghost;
    this.cop.say('Wheeet! Slide the glowing vehicle to the faded spot.');
  }

  clearHint() {
    if (this.hintSprite) { this.hintSprite.setGlow(false); this.hintSprite = null; }
    if (this.hintGhost) { this.hintGhost.destroy(); this.hintGhost = null; }
  }

  offerSkip() {
    const m = this.metrics.current;
    if (m && m.restarts >= 3) this.skipBtn.setVisible(true);
  }

  skip() {
    if (this.busy) return;
    this.clearHint();
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
