/**
 * JarSprite
 * One glass jar: back glass, the spice scoops, then front glass on top.
 * The container's origin is the jar's top-centre; it is scaled to fit the shelf.
 */
class JarSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, index, capacity, scale) {
    super(scene, x, y);
    const J = GameConfig.JAR;
    this.index = index;
    this.capacity = capacity;
    this.baseX = x;
    this.baseY = y;
    this.h = J.heights[capacity];

    this.glow = scene.add.rectangle(0, this.h / 2 + 6, J.w - 10, this.h - 10, GameConfig.COLORS.accent, 0).setStrokeStyle(8, GameConfig.COLORS.accent, 0);
    this.back = scene.add.image(0, 0, 'jar' + capacity + '_back').setOrigin(0.5, 0);
    this.scoopLayer = scene.add.container(0, 0);
    this.front = scene.add.image(0, 0, 'jar' + capacity + '_front').setOrigin(0.5, 0);
    this.add([this.glow, this.back, this.scoopLayer, this.front]);

    this.setScale(scale);
    this.setSize(J.w, this.h);
    // hit area covers the whole jar (container size is centred on its origin)
    this.setInteractive(new Phaser.Geom.Rectangle(-J.w / 2, 0, J.w, this.h), Phaser.Geom.Rectangle.Contains);
    this.input.cursor = 'pointer';
    scene.add.existing(this);
  }

  /**
   * @param {string} jar      contents, bottom → top (letters)
   * @param {boolean[]} known whether each position can be seen (hidden levels)
   * @param {function(string):string} keyFor  letter → texture key
   */
  refresh(jar, known, keyFor) {
    const J = GameConfig.JAR;
    this.scoopLayer.removeAll(true);
    for (let k = 0; k < jar.length; k++) {
      const y = J.top + (this.capacity - 1 - k) * J.scoop + J.scoop / 2;
      const key = known[k] ? keyFor(jar[k]) : 'scoop_hidden';
      this.scoopLayer.add(this.scene.add.image(0, y, key).setDisplaySize(J.innerW, J.scoop));
    }
  }

  setSelected(on) {
    this.scene.tweens.add({ targets: this, y: this.baseY - (on ? 26 : 0), duration: 140, ease: 'Sine.easeOut' });
    this.glow.setStrokeStyle(8, GameConfig.COLORS.accent, on ? 0.9 : 0);
  }

  /** Shake sideways when a pour is not allowed. */
  shake() {
    this.scene.tweens.add({
      targets: this, x: this.baseX + 8, duration: 60, yoyo: true, repeat: 2,
      onComplete: () => { this.x = this.baseX; }
    });
  }

  /** Glow pulse used by hints. */
  pulse() {
    this.glow.setStrokeStyle(8, 0x9be15d, 1);
    this.scene.tweens.add({
      targets: this.glow, alpha: { from: 1, to: 0.2 }, duration: 260, yoyo: true, repeat: 3,
      onComplete: () => { this.glow.setAlpha(1); this.glow.setStrokeStyle(8, GameConfig.COLORS.accent, 0); }
    });
  }

  /** Mouth position (where spice comes out) in world coordinates, for the pour stream. */
  mouth() {
    return { x: this.x, y: this.y + 30 * this.scaleY };
  }
}
