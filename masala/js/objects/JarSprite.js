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

    // visible glass (the art has a transparent margin): x -66..66, y 24..h-10
    this.glassW = 132;
    this.glassH = this.h - 34;
    this.glassY = 24 + this.glassH / 2;
    // selection look: a glowing pad behind the jar and a pulsing glow filled over the glass
    this.halo = scene.add.image(0, this.glassY, '__DEFAULT').setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.back = scene.add.image(0, 0, 'jar' + capacity + '_back').setOrigin(0.5, 0);
    this.scoopLayer = scene.add.container(0, 0);
    this.front = scene.add.image(0, 0, 'jar' + capacity + '_front').setOrigin(0.5, 0);
    this.flash = scene.add.image(0, 0, 'jar' + capacity + '_front').setOrigin(0.5, 0).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.add([this.halo, this.back, this.scoopLayer, this.front, this.flash]);

    this.setScale(scale);
    this.setSize(J.w, this.h);
    // Hit area covers the whole jar. Phaser tests a sized container's hit area
    // from its top-left corner (local point + width/2, height/2). This jar's
    // origin is its top-centre, so the jar spans x 0..w and y h/2..3h/2 there.
    this.setInteractive(new Phaser.Geom.Rectangle(0, this.h / 2, J.w, this.h), Phaser.Geom.Rectangle.Contains);
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
    this.setGlow(on, GlowFx.SELECT);
  }

  /**
   * Game-style highlight: halo behind the jar plus a pulsing glow over the glass.
   * repeat: -1 to keep pulsing until switched off, or a count for a short flash.
   */
  setGlow(on, color, repeat, done) {
    if (this.glowTweens) { this.glowTweens.forEach(t => t.stop()); this.glowTweens = null; }
    this.halo.setVisible(on);
    this.flash.setVisible(on);
    if (!on) return;
    const h = GlowFx.halo(this.scene, this.glassW, this.glassH, color, 26);
    this.halo.setTexture(h.key).setDisplaySize(this.glassW + h.pad * 2, this.glassH + h.pad * 2).setAlpha(0.95);
    this.flash.setTintFill(color).setAlpha(0.12);
    const rep = repeat === undefined ? -1 : repeat;
    this.glowTweens = [
      this.scene.tweens.add({ targets: this.halo, alpha: 0.45, duration: 380, yoyo: true, repeat: rep, ease: 'Sine.easeInOut' }),
      this.scene.tweens.add({
        targets: this.flash, alpha: 0.4, duration: 380, yoyo: true, repeat: rep, ease: 'Sine.easeInOut',
        onComplete: () => { if (rep >= 0) { this.setGlow(false); if (done) done(); } }
      })
    ];
  }

  /** Shake sideways when a pour is not allowed. */
  shake() {
    this.scene.tweens.add({
      targets: this, x: this.baseX + 8, duration: 60, yoyo: true, repeat: 2,
      onComplete: () => { this.x = this.baseX; }
    });
  }

  /** Green flash used by hints (unless the jar is already picked up). */
  pulse() {
    this.setGlow(true, GlowFx.HINT, 2, () => { if (this.scene.selected === this.index) this.setGlow(true, GlowFx.SELECT); });
  }

  /** Mouth position (where spice comes out) in world coordinates, for the pour stream. */
  mouth() {
    return { x: this.x, y: this.y + 30 * this.scaleY };
  }
}
