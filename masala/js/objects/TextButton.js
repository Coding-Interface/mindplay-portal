/**
 * TextButton
 * Rounded, touch-friendly button (min 56px tall) with press feedback.
 */
class TextButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, label, onClick, opts) {
    super(scene, x, y);
    const o = Object.assign({ width: 180, height: 64, fill: 0xffd23f, shade: 0xd19c00, color: '#0f3d42', fontSize: 28 }, opts || {});
    this.opts = o;
    this.onClick = onClick;
    this.enabled = true;

    this.shadow = scene.add.graphics();
    this.face = scene.add.graphics();
    this.label = scene.add.text(0, -2, label, {
      fontFamily: GameConfig.FONT, fontSize: o.fontSize + 'px', color: o.color, fontStyle: '700'
    }).setOrigin(0.5);
    this.add([this.shadow, this.face, this.label]);
    this.draw(0);

    this.setSize(o.width, o.height + 6);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => { if (this.enabled) this.draw(4); });
    this.on('pointerout', () => this.draw(0));
    this.on('pointerup', () => {
      this.draw(0);
      if (this.enabled && this.onClick) this.onClick();
    });
    scene.add.existing(this);
  }

  draw(press) {
    const o = this.opts;
    const w = o.width;
    const h = o.height;
    this.shadow.clear().fillStyle(o.shade, 1).fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 18);
    this.face.clear().fillStyle(o.fill, 1).fillRoundedRect(-w / 2, -h / 2 + press, w, h, 18);
    this.label.y = -2 + press;
  }

  setLabel(t) {
    this.label.setText(t);
    return this;
  }

  setEnabled(on) {
    this.enabled = on;
    this.setAlpha(on ? 1 : 0.45);
    return this;
  }

  pulse() {
    this.scene.tweens.add({ targets: this, scale: 1.12, duration: 220, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
  }
}
