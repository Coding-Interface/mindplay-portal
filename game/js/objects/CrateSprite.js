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

    this.ring = scene.add.image(0, 0, theme.key('select')).setDisplaySize(cell * 1.08, cell * 1.08).setVisible(false);
    this.crateImg = scene.add.image(0, 0, theme.key('crate' + box.color)).setDisplaySize(cell * 0.96, cell * 0.96);
    this.add([this.ring, this.crateImg]);

    this.setSize(cell, cell);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
  }

  setSelected(on) {
    this.ring.setVisible(on);
    if (this.ringTween) {
      this.ringTween.stop();
      this.ringTween = null;
    }
    this.ring.setAlpha(1);
    if (on) {
      this.ringTween = this.scene.tweens.add({ targets: this.ring, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
    }
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
