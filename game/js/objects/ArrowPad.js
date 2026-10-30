/**
 * ArrowPad
 * Four big arrows shown around the selected crate. Only directions the crate
 * can actually move in are shown; this keeps taps purposeful for young players.
 */
class ArrowPad {
  constructor(scene, onChoose) {
    this.scene = scene;
    this.onChoose = onChoose;
    this.arrows = {};
    const angles = { up: 0, right: 90, down: 180, left: 270 };
    PuzzleLayout.DIR_NAMES.forEach(dir => {
      const a = scene.add.image(0, 0, 'arrow').setAngle(angles[dir]).setDepth(50).setVisible(false);
      a.setInteractive({ useHandCursor: true });
      a.on('pointerup', () => this.onChoose(dir));
      a.dir = dir;
      this.arrows[dir] = a;
    });
    this.tweens = [];
  }

  /**
   * @param {{x:number,y:number}} center   crate position
   * @param {number} cell                  cell size in px
   * @param {string[]} dirs                directions to show
   */
  show(center, cell, dirs) {
    this.hide();
    const size = Math.max(54, cell * 0.62);
    const off = cell * 0.82;
    dirs.forEach(dir => {
      const d = PuzzleLayout.DIRS[dir];
      const a = this.arrows[dir];
      a.setDisplaySize(size, size);
      a.setPosition(center.x + d.dc * off, center.y + d.dr * off);
      a.setVisible(true).setAlpha(0);
      this.tweens.push(this.scene.tweens.add({ targets: a, alpha: 1, duration: 120 }));
    });
  }

  /** Make one arrow pulse (used by hints). */
  highlight(dir) {
    const a = this.arrows[dir];
    if (!a || !a.visible) return;
    const base = a.scaleX;
    this.tweens.push(this.scene.tweens.add({ targets: a, scaleX: base * 1.25, scaleY: base * 1.25, duration: 260, yoyo: true, repeat: 4 }));
  }

  hide() {
    this.tweens.forEach(t => t.stop());
    this.tweens = [];
    Object.values(this.arrows).forEach(a => a.setVisible(false));
  }

  destroy() {
    this.hide();
    Object.values(this.arrows).forEach(a => a.destroy());
  }
}
