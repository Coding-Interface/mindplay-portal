/**
 * HudBar
 * Top bar: title, level progress dots, star total and move counter.
 * Tips come from the traffic constable (CopTip).
 */
class HudBar {
  constructor(scene, totalLevels) {
    this.scene = scene;
    const W = scene.scale.width;
    const C = GameConfig.COLORS;
    const font = GameConfig.FONT;

    scene.add.rectangle(W / 2, 40, W, 80, C.panel).setDepth(10);

    this.title = scene.add.text(28, 40, 'Get the Auto Out', {
      fontFamily: font, fontSize: '30px', color: C.text, fontStyle: '800'
    }).setOrigin(0, 0.5).setDepth(11);

    // progress dots
    this.dots = [];
    const startX = W / 2 - (totalLevels - 1) * 17;
    for (let i = 0; i < totalLevels; i++) {
      this.dots.push(scene.add.circle(startX + i * 34, 30, 11, C.dotEmpty).setDepth(11));
    }
    this.levelText = scene.add.text(W / 2, 60, '', {
      fontFamily: font, fontSize: '18px', color: C.textDim
    }).setOrigin(0.5).setDepth(11);

    this.starIcon = scene.add.image(W - 370, 40, 'star').setDisplaySize(40, 40).setDepth(11);
    this.starText = scene.add.text(W - 344, 40, '0', {
      fontFamily: font, fontSize: '30px', color: C.text, fontStyle: '700'
    }).setOrigin(0, 0.5).setDepth(11);

    this.movesText = scene.add.text(W - 28, 40, '', {
      fontFamily: font, fontSize: '26px', color: C.text, fontStyle: '700', align: 'right'
    }).setOrigin(1, 0.5).setDepth(11);
  }

  setLevel(index, total, results) {
    this.levelText.setText('Level ' + (index + 1) + ' of ' + total);
    this.dots.forEach((d, i) => {
      if (i < results.length) d.setFillStyle(results[i].solved ? GameConfig.COLORS.good : GameConfig.COLORS.warn);
      else if (i === index) d.setFillStyle(GameConfig.COLORS.accent);
      else d.setFillStyle(GameConfig.COLORS.dotEmpty);
    });
  }

  setStars(n) {
    this.starText.setText(String(n));
  }

  setMoves(moves, best) {
    this.movesText.setText('Moves ' + moves + '  ·  Best ' + best);
  }
}
