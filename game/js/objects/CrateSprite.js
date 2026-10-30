/**
 * CrateSprite
 * One movable piece on the board (cart or marble, depending on the theme).
 * Handles its own selection look and animations.
 */
class CrateSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, box, cell, theme) {
    super(scene, x, y);
    this.boxId = box.id;
    this.color = box.color;
    this.cell = cell;

    // selection look: a glowing pad under the piece and a pulsing glow over it
    this.glowSize = Math.round(cell * 0.86);
    this.glowRadius = CrateSprite.ROUND[theme.id] ? this.glowSize / 2 : Math.round(cell * 0.2);
    this.halo = scene.add.image(0, 0, '__DEFAULT').setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.crateImg = scene.add.image(0, 0, theme.key('crate' + box.color)).setDisplaySize(cell * 0.96, cell * 0.96);
    this.flash = scene.add.image(0, 0, theme.key('crate' + box.color)).setDisplaySize(cell * 0.96, cell * 0.96)
      .setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.add([this.halo, this.crateImg, this.flash]);

    this.setSize(cell, cell);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
  }

  setSelected(on) {
    if (this.glowTweens) { this.glowTweens.forEach(t => t.stop()); this.glowTweens = null; }
    this.halo.setVisible(on);
    this.flash.setVisible(on);
    if (!on) return;
    const h = GlowFx.halo(this.scene, this.glowSize, this.glowSize, GlowFx.SELECT, this.glowRadius);
    this.halo.setTexture(h.key).setDisplaySize(this.glowSize + h.pad * 2, this.glowSize + h.pad * 2).setAlpha(0.95);
    this.flash.setTintFill(GlowFx.SELECT).setAlpha(0.12);
    this.glowTweens = [
      this.scene.tweens.add({ targets: this.halo, alpha: 0.45, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      this.scene.tweens.add({ targets: this.flash, alpha: 0.42, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    ];
  }

  /** Slide through a list of points [{x,y}], then call done(). */
  slideAlong(points, done) {
    const per = 70;
    const last = points[points.length - 1];
    this.scene.tweens.add({
      targets: this,
      x: last.x,
      y: last.y,
      duration: Math.max(120, per * points.length),
      ease: 'Quad.easeOut',
      onComplete: () => done && done()
    });
  }

  /** Shrink into a hole. */
  dropIn(done) {
    this.disableInteractive();
    this.scene.tweens.add({
      targets: this,
      scale: 0.2,
      alpha: 0,
      duration: 220,
      ease: 'Back.easeIn',
      onComplete: () => done && done()
    });
  }

  /** Small shake in a direction when a move is blocked. */
  nudge(dir) {
    const d = PuzzleLayout.DIRS[dir];
    const ox = this.x;
    const oy = this.y;
    this.scene.tweens.add({
      targets: this,
      x: ox + d.dc * this.cell * 0.12,
      y: oy + d.dr * this.cell * 0.12,
      duration: 70,
      yoyo: true,
      repeat: 1,
      onComplete: () => { this.x = ox; this.y = oy; }
    });
  }

  /** Bounce to show a piece is the hint target. */
  wiggle() {
    this.scene.tweens.add({
      targets: this.crateImg, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 3,
      onComplete: () => { this.crateImg.angle = 0; }
    });
  }
}

/** Themes whose pieces are round (marbles, water drops): the glow is a circle. */
CrateSprite.ROUND = { kanche: true, fields: true };
