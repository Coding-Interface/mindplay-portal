/**
 * LevelCompletePanel
 * Overlay shown after each level: stars, moves vs best, and a Next button.
 */
class LevelCompletePanel {
  constructor(scene, result, isLast, theme, onNext) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const C = theme.colors;
    const font = GameConfig.FONT;
    this.items = [];

    const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setDepth(100).setInteractive();
    const card = scene.add.graphics().setDepth(101);
    card.fillStyle(C.panel, 1).fillRoundedRect(W / 2 - 300, H / 2 - 210, 600, 420, 30);
    card.lineStyle(6, C.panelLine, 1).strokeRoundedRect(W / 2 - 300, H / 2 - 210, 600, 420, 30);
    this.items.push(shade, card);

    const heading = result.skipped ? 'Level skipped' : ['Solved!', 'Well done!', 'Perfect plan!'][Math.max(0, result.stars - 1)];
    this.items.push(scene.add.text(W / 2, H / 2 - 160, heading, {
      fontFamily: font, fontSize: '54px', color: C.text, fontStyle: '800'
    }).setOrigin(0.5).setDepth(102));

    for (let i = 0; i < 3; i++) {
      const s = scene.add.image(W / 2 + (i - 1) * 110, H / 2 - 50, i < result.stars ? 'star' : 'starEmpty')
        .setDisplaySize(100, 100).setDepth(102).setScale(0);
      scene.tweens.add({ targets: s, scale: 100 / 128, duration: 300, delay: 150 + i * 160, ease: 'Back.easeOut' });
      this.items.push(s);
    }

    const lines = result.skipped
      ? 'That one was tricky. On to the next!'
      : theme.movesLabel + ': ' + result.moves + '   Best possible: ' + result.optimal +
        (result.hints ? '\nHints used: ' + result.hints : '');
    this.items.push(scene.add.text(W / 2, H / 2 + 50, lines, {
      fontFamily: font, fontSize: '28px', color: C.textDim, align: 'center'
    }).setOrigin(0.5).setDepth(102));

    this.onNext = onNext;
    const btn = new TextButton(scene, W / 2, H / 2 + 140, isLast ? 'See results' : 'Next level', () => this.next(),
      { width: 280, height: 70, fontSize: 32 });
    btn.setDepth(103);
    this.items.push(btn);
  }

  next() {
    if (!this.items.length) return;
    this.destroy();
    this.onNext();
  }

  destroy() {
    this.items.forEach(i => i.destroy());
    this.items = [];
  }
}
