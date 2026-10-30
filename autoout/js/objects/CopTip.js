/**
 * CopTip
 * The traffic constable in the corner of the school campus. He gives each
 * level's coaching tip, warns when a move is blocked, and blows his whistle
 * for hints. say(text, warn) updates his speech card with a little pop.
 */
class CopTip {
  constructor(scene) {
    this.scene = scene;
    const C = GameConfig.COLORS;
    const x = 904;
    const y = 494;
    const w = 364;
    const h = 136;
    this.card = scene.add.graphics().setDepth(14);
    this.card.fillStyle(0x000000, 0.28).fillRoundedRect(x + 4, y + 6, w, h, 20);
    this.cardFace = scene.add.graphics().setDepth(14);
    this.box = { x, y, w, h };
    this.paint(false);

    this.portrait = scene.add.image(x + 54, y + h / 2, 'cop').setDisplaySize(96, 96).setDepth(15);
    this.name = scene.add.text(x + 110, y + 12, 'Traffic Hawaldar Singh', {
      fontFamily: GameConfig.FONT, fontSize: '16px', color: '#8a5a00', fontStyle: '800'
    }).setDepth(15);
    this.text = scene.add.text(x + 110, y + 34, '', {
      fontFamily: GameConfig.FONT, fontSize: '19px', color: C.tipText, fontStyle: '700',
      wordWrap: { width: w - 124 }, lineSpacing: -2
    }).setDepth(15);
  }

  paint(warn) {
    const b = this.box;
    this.cardFace.clear();
    this.cardFace.fillStyle(warn ? 0xffe1d6 : 0xfffaf0, 1).fillRoundedRect(b.x, b.y, b.w, b.h, 20);
    this.cardFace.lineStyle(4, warn ? GameConfig.COLORS.warn : GameConfig.COLORS.accent, 1).strokeRoundedRect(b.x, b.y, b.w, b.h, 20);
  }

  say(text, warn) {
    if (this.text.text === text && this.warn === !!warn) return;
    this.warn = !!warn;
    this.text.setText(text);
    this.paint(this.warn);
    this.portrait.setScale(this.portrait.scaleX * 0.85, this.portrait.scaleY * 0.85);
    this.scene.tweens.add({ targets: this.portrait, displayWidth: 96, displayHeight: 96, duration: 240, ease: 'Back.easeOut' });
  }
}
