/**
 * RuleCard
 * Teaches a rule the first time it appears, with a small picture made
 * from the real game art. "Got it" closes it.
 */
class RuleCard {
  constructor(scene, rule, onClose) {
    this.scene = scene;
    this.items = [];
    this.onClose = onClose;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const C = GameConfig.COLORS;
    const font = GameConfig.FONT;
    const info = RuleCard.RULES[rule];

    const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(100).setInteractive();
    const card = scene.add.graphics().setDepth(101);
    card.fillStyle(C.panel, 1).fillRoundedRect(W / 2 - 460, 80, 920, 560, 30);
    card.lineStyle(6, C.panelLine, 1).strokeRoundedRect(W / 2 - 460, 80, 920, 560, 30);
    this.items.push(shade, card);
    this.items.push(scene.add.text(W / 2, 130, info.title, { fontFamily: font, fontSize: '44px', color: C.text, fontStyle: '800' }).setOrigin(0.5).setDepth(102));

    // little example: jars drawn from the real art
    info.jars.forEach((j, i) => {
      const x = W / 2 + (i - (info.jars.length - 1) / 2) * 270;
      const y = 180;
      const s = 0.62;
      const parts = [scene.add.image(x, y, 'jar4_back').setOrigin(0.5, 0).setScale(s)];
      j.split('').forEach((c, k) => {
        const key = c === '?' ? 'scoop_hidden' : 'scoop_' + SpiceTable.get(c.charCodeAt(0) - 97).key;
        parts.push(scene.add.image(x, y + (60 + (3 - k) * 50 + 25) * s, key).setDisplaySize(100 * s, 50 * s));
      });
      parts.push(scene.add.image(x, y, 'jar4_front').setOrigin(0.5, 0).setScale(s));
      parts.forEach(p => p.setDepth(102));
      this.items.push(...parts);
      if (info.arrows && info.arrows[i]) {
        this.items.push(scene.add.text(x, y + 196, info.arrows[i], { fontFamily: font, fontSize: '22px', color: C.textDim, fontStyle: '700', align: 'center', wordWrap: { width: 240 } }).setOrigin(0.5, 0).setDepth(102));
      }
    });

    this.items.push(scene.add.text(W / 2, 490, info.text, {
      fontFamily: font, fontSize: '26px', color: C.textDim, align: 'center', wordWrap: { width: 820 }
    }).setOrigin(0.5).setDepth(102));

    const btn = new TextButton(scene, W / 2, 590, 'Got it!', () => this.close(),
      { width: 240, height: 64, fontSize: 30, fill: C.accent, shade: C.accentDark });
    btn.setDepth(103);
    this.items.push(btn);
  }

  close() {
    if (!this.items.length) return;
    this.items.forEach(o => o.destroy());
    this.items = [];
    this.onClose();
  }
}

RuleCard.RULES = {
  pour: {
    title: 'Sort the masala box',
    jars: ['abab', 'ab', ''],
    arrows: ['Pour from here…', '…onto the same spice', '…or into an empty jar'],
    text: 'Tap a jar, then tap where to pour. Spice can only go on top of the same spice, or into an empty jar. Fill each jar with one spice.'
  },
  hidden: {
    title: 'Frosted jars',
    jars: ['??ab', '???c', 'ca'],
    arrows: ['Only the top spice shows', 'Pour to uncover more', 'Uncovered spice stays visible'],
    text: 'Some jars are frosted. You can only see the top spice until you pour it off. Remember what you uncover and plan with it.'
  }
};
