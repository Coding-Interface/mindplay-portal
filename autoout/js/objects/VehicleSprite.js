/**
 * VehicleSprite
 * One vehicle (or blocker) on the lot. Art is drawn lying horizontally with
 * the front on the right; vertical vehicles are rotated 90° (front pointing down).
 * Knows its lane and converts between lane position and pixels for the
 * current lot (cell size changes with the lot size).
 * Has a soft shadow cast to the bottom-right, a game-style glow when selected and for hints,
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
    this.boxW = w;
    this.boxH = h;
    // selection look: a glowing pad under the vehicle and a pulsing glow over it
    this.halo = scene.add.image(0, 0, '__DEFAULT').setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.flash = scene.add.image(0, 0, vehicle.kind).setDisplaySize(w, h).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    if (!vehicle.horiz) {
      this.halo.setAngle(90);
      this.flash.setAngle(90);
    }
    this.add([this.shadow, this.halo, this.img, this.flash]);
    this.baseScaleX = this.img.scaleX;
    this.baseScaleY = this.img.scaleY;

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

  /**
   * Drive to a lane position like a real vehicle: it pulls away (body
   * stretches a little, exhaust puffs), runs a touch past the spot, then
   * brakes back with a bounce and a puff of tyre dust.
   * onBrake(cells) fires as it starts braking (for the screech), done() at rest.
   */
  driveTo(pos, onBrake, done) {
    const v = this.vehicle;
    const c = this.centreFor(pos);
    const axis = v.horiz ? 'x' : 'y';
    const from = this[axis];
    const to = v.horiz ? c.x : c.y;
    const dir = Math.sign(to - from);
    const cells = Math.abs(to - from) / this.cell;
    if (!dir) { if (done) done(); return; }
    const over = Math.min(7, this.cell * 0.09);
    const dur = Math.min(640, 200 + cells * 90);
    const s = this.scene;
    // body stretch while pulling away (the art's length is always its local x)
    s.tweens.killTweensOf([this.img, this.flash]);
    this.img.setScale(this.baseScaleX, this.baseScaleY);
    this.flash.setScale(this.baseScaleX, this.baseScaleY);
    s.tweens.add({
      targets: [this.img, this.flash], scaleX: this.baseScaleX * 1.06, scaleY: this.baseScaleY * 0.96,
      duration: dur * 0.45, yoyo: true, ease: 'Sine.easeOut'
    });
    this.puff(3, dir);
    s.tweens.add({
      targets: this, [axis]: to + dir * over, duration: dur, ease: 'Cubic.easeInOut',
      onComplete: () => {
        if (onBrake) onBrake(cells);
        this.dust(dir);
        s.tweens.add({ targets: this, [axis]: to, duration: 170, ease: 'Back.easeOut', onComplete: () => done && done() });
      }
    });
  }

  /** Puff of tyre dust at the front when braking. */
  dust(dir) {
    const v = this.vehicle;
    const half = (v.len * this.cell) / 2;
    const fx = v.horiz ? this.x + dir * half : this.x;
    const fy = v.horiz ? this.y : this.y + dir * half;
    for (let i = 0; i < 4; i++) {
      const side = (i % 2 ? 1 : -1) * this.cell * 0.3;
      const p = this.scene.add.image(fx + (v.horiz ? 0 : side), fy + (v.horiz ? side : 0), 'puff')
        .setDepth(this.depth + 1).setAlpha(0.55).setScale(0.3).setTint(0xd9cbb0);
      this.scene.tweens.add({
        targets: p, x: p.x + (v.horiz ? dir * 14 : side * 0.3), y: p.y + (v.horiz ? side * 0.3 : dir * 14),
        scale: 0.9, alpha: 0, duration: 420, delay: i * 40, onComplete: () => p.destroy()
      });
    }
  }

  /** Light hover highlight for mouse users (ignored while glowing). */
  setHover(on) {
    if (this.glowTweens) return;
    this.flash.setVisible(on);
    if (on) this.flash.setTintFill(0xffffff).setAlpha(0.16);
  }

  /**
   * Game-style highlight. color: GlowFx.SELECT (gold, picked up) or GlowFx.HINT (green).
   */
  setGlow(on, color) {
    if (this.glowTweens) { this.glowTweens.forEach(t => t.stop()); this.glowTweens = null; }
    this.halo.setVisible(on);
    this.flash.setVisible(on);
    if (!on) return;
    const c = color || GlowFx.SELECT;
    const h = GlowFx.halo(this.scene, this.boxW, this.boxH, c, Math.min(this.boxH * 0.3, 18));
    this.halo.setTexture(h.key).setDisplaySize(this.boxW + h.pad * 2, this.boxH + h.pad * 2).setAlpha(0.9);
    this.flash.setTintFill(c).setAlpha(0.15);
    this.glowTweens = [
      this.scene.tweens.add({ targets: this.halo, alpha: 0.45, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      this.scene.tweens.add({ targets: this.flash, alpha: 0.45, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    ];
  }

  /** Lift slightly (kept for custom controls; driving uses driveTo). */
  setLifted(on) {
    const k = on ? 1.06 : 1;
    this.scene.tweens.add({ targets: [this.img, this.flash], scaleX: this.baseScaleX * k, scaleY: this.baseScaleY * k, duration: 90 });
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

  /** Exhaust puffs from the back of the vehicle (dir: direction of travel, default forward). */
  puff(count, dir) {
    if (this.vehicle.fixed) return;
    const v = this.vehicle;
    const d = dir || 1;
    const half = (v.len * this.cell) / 2;
    const bx = v.horiz ? this.x - d * half : this.x;
    const by = v.horiz ? this.y : this.y - d * half;
    for (let i = 0; i < (count || 3); i++) {
      const p = this.scene.add.image(bx, by, 'puff').setDepth(this.depth - 1).setAlpha(0.7).setScale(0.4);
      this.scene.tweens.add({
        targets: p,
        x: bx + (v.horiz ? -d * (18 + i * 10) : (Math.random() - 0.5) * 20),
        y: by + (v.horiz ? (Math.random() - 0.5) * 20 : -d * (18 + i * 10)),
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
    if (this.glowTweens) this.glowTweens.forEach(t => t.stop());
    super.destroy(fromScene);
  }
}

/** What each vehicle or blocker "says" when tapped while stuck. */
VehicleSprite.SAYS = {
  van: 'BEEP BEEP!', auto: 'PEEP PEEP!', car: 'HONK!', hatch: 'BEEP!', sedan: 'HONK HONK!', taxi: 'POM POM!',
  tempo: 'PAAN!', bus: 'BHOOOM!', truck: 'PAA-PAA-PAAA!', tanker: 'BHAAAP!',
  cow: 'MOOO!', barricade: 'CLANK!', cart: 'TRING TRING!'
};
