/**
 * VehicleSprite
 * One vehicle (or blocker) on the lot. Art is drawn lying horizontally with
 * the front on the right; vertical vehicles are rotated 90° (front pointing down).
 * Knows its lane and converts between lane position and pixels for the
 * current lot (cell size changes with the lot size).
 * Has a soft shadow cast to the bottom-right, a glow ring for hints and drags,
 * exhaust puffs when it moves, and a comic speech bubble ("PEEP PEEP!").
 */
class VehicleSprite extends Phaser.GameObjects.Container {
  constructor(scene, vehicle, pos, board) {
    super(scene, 0, 0);
    this.vehicle = vehicle;
    this.id = vehicle.id;
    this.board = board;
    const cell = board.cell;
    this.cell = cell;

    const blocker = vehicle.fixed;
    const w = blocker ? cell - 4 : vehicle.len * cell - 4;
    const h = blocker ? cell - 4 : cell - 2;
    const off = Math.max(3, cell * 0.06);
    this.shadow = scene.add.image(off, off, vehicle.kind).setDisplaySize(w, h).setTint(0x000000).setAlpha(0.32);
    this.img = scene.add.image(0, 0, vehicle.kind).setDisplaySize(w, h);
    if (!vehicle.horiz) {
      this.img.setAngle(90);
      this.shadow.setAngle(90);
    }
    const bw = vehicle.horiz ? w : h;
    const bh = vehicle.horiz ? h : w;
    this.ring = scene.add.rectangle(0, 0, bw + 6, bh + 6).setStrokeStyle(5, GameConfig.COLORS.accent, 1).setFillStyle(0, 0).setVisible(false);
    this.add([this.shadow, this.ring, this.img]);

    this.setSize(bw, bh);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
    this.placeAt(pos);
  }

  /** Pixel centre for a lane position. */
  centreFor(pos) {
    const B = this.board;
    const v = this.vehicle;
    const along = (pos + v.len / 2) * B.cell;
    const across = (v.lane + 0.5) * B.cell;
    return v.horiz ? { x: B.x + along, y: B.y + across } : { x: B.x + across, y: B.y + along };
  }

  placeAt(pos) {
    const c = this.centreFor(pos);
    this.setPosition(c.x, c.y);
  }

  slideTo(pos, done) {
    const c = this.centreFor(pos);
    const dist = Math.abs(c.x - this.x) + Math.abs(c.y - this.y);
    this.scene.tweens.add({
      targets: this, x: c.x, y: c.y, duration: Math.min(320, 140 + dist * 0.35), ease: 'Quad.easeOut',
      onComplete: () => done && done()
    });
  }

  setGlow(on) {
    this.ring.setVisible(on);
    if (this.glowTween) { this.glowTween.stop(); this.glowTween = null; }
    this.ring.setAlpha(1);
    if (on) this.glowTween = this.scene.tweens.add({ targets: this.ring, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
  }

  /** Lift slightly while being dragged. */
  setLifted(on) {
    this.scene.tweens.add({ targets: this.img, scale: this.img.scale * (on ? 1.04 : 1 / 1.04), duration: 90 });
    this.shadow.setAlpha(on ? 0.42 : 0.32);
  }

  /** Small shake along its lane: "I can't move". */
  bump() {
    const ox = this.x;
    const oy = this.y;
    const k = Math.max(4, this.cell * 0.07);
    this.scene.tweens.add({
      targets: this, x: this.vehicle.horiz ? ox + k : ox, y: this.vehicle.horiz ? oy : oy + k,
      duration: 45, yoyo: true, repeat: 2, onComplete: () => this.setPosition(ox, oy)
    });
  }

  /** Exhaust puffs from the back of the vehicle. */
  puff(count) {
    if (this.vehicle.fixed) return;
    const v = this.vehicle;
    const half = (v.len * this.cell) / 2;
    const bx = v.horiz ? this.x - half : this.x;
    const by = v.horiz ? this.y : this.y - half;
    for (let i = 0; i < (count || 3); i++) {
      const p = this.scene.add.image(bx, by, 'puff').setDepth(this.depth - 1).setAlpha(0.7).setScale(0.4);
      this.scene.tweens.add({
        targets: p,
        x: bx + (v.horiz ? -18 - i * 10 : (Math.random() - 0.5) * 20),
        y: by + (v.horiz ? (Math.random() - 0.5) * 20 : -18 - i * 10),
        scale: 1.3 + i * 0.3, alpha: 0, duration: 650 + i * 120, delay: i * 70,
        onComplete: () => p.destroy()
      });
    }
  }

  /** Comic speech bubble above the vehicle. */
  say(text) {
    const s = this.scene;
    if (this.bubble) this.bubble.destroy();
    const t = s.add.text(0, 0, text, {
      fontFamily: GameConfig.FONT, fontSize: '22px', color: '#1d2a33', fontStyle: '800',
      backgroundColor: '#ffffff', padding: { x: 10, y: 3 }
    }).setOrigin(0.5);
    const top = this.y - this.height / 2 - 18;
    const bubble = s.add.container(this.x, Math.max(100, top), [t]).setDepth(60);
    bubble.setScale(0.3);
    this.bubble = bubble;
    s.tweens.add({ targets: bubble, scale: 1, duration: 180, ease: 'Back.easeOut' });
    s.tweens.add({ targets: bubble, y: bubble.y - 16, alpha: 0, delay: 650, duration: 380, onComplete: () => { bubble.destroy(); if (this.bubble === bubble) this.bubble = null; } });
  }

  destroy(fromScene) {
    if (this.bubble) this.bubble.destroy();
    if (this.glowTween) this.glowTween.stop();
    super.destroy(fromScene);
  }
}

/** What each vehicle or blocker "says" when tapped while stuck. */
VehicleSprite.SAYS = {
  van: 'BEEP BEEP!', auto: 'PEEP PEEP!', car: 'HONK!', hatch: 'BEEP!', sedan: 'HONK HONK!', taxi: 'POM POM!',
  tempo: 'PAAN!', bus: 'BHOOOM!', truck: 'PAA-PAA-PAAA!', tanker: 'BHAAAP!',
  cow: 'MOOO!', barricade: 'CLANK!', cart: 'TRING TRING!'
};
