/**
 * MenuScene
 * Title over the school-gate street, class picker (3–8) and difficulty mode.
 */
class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const C = GameConfig.COLORS;
    const font = GameConfig.FONT;
    const storage = this.registry.get('storage');
    const sound = this.registry.get('sfx');
    this.mode = storage.get('mode', 'fixed');

    this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35);
    const panel = this.add.graphics();
    panel.fillStyle(0x10191f, 0.72).fillRoundedRect(W / 2 - 470, 22, 940, 600, 30);
    panel.lineStyle(4, GameConfig.COLORS.accent, 0.8).strokeRoundedRect(W / 2 - 470, 22, 940, 600, 30);
    // a little jam as decoration
    [['bus', 170, 470, 0, 0.5], ['auto', 1120, 470, 0, 0.6], ['van', 560, 660, 0, 0.6], ['tanker', 840, 660, 0, 0.42], ['taxi', 110, 250, 90, 0.6], ['sedan', 1170, 250, 90, 0.6], ['cow', 1180, 620, 0, 0.9]].forEach(([k, x, y, a, sc]) => {
      this.add.image(x + 5, y + 6, k).setAngle(a).setScale(sc).setTint(0x000000).setAlpha(0.35);
      this.add.image(x, y, k).setAngle(a).setScale(sc);
    });

    this.add.text(W / 2, 76, 'Get the Auto Out', { fontFamily: font, fontSize: '80px', color: C.text, fontStyle: '800' })
      .setOrigin(0.5).setShadow(0, 6, '#000000', 0, false, true);
    this.add.text(W / 2, 142, 'Morning rush at the school gate! Slide the vehicles so the school van can reach the gate.', {
      fontFamily: font, fontSize: '26px', color: C.textDim, align: 'center', wordWrap: { width: 840 }
    }).setOrigin(0.5);

    this.add.text(W / 2, 236, 'Which class are you in?', { fontFamily: font, fontSize: '32px', color: C.text, fontStyle: '700' }).setOrigin(0.5);
    [3, 4, 5, 6, 7, 8].forEach((cls, i) => {
      const junior = cls <= 5;
      new TextButton(this, W / 2 + (i - 2.5) * 140, 318, String(cls), () => {
        sound.tap();
        sound.horn('van');
        sound.startAmbience();
        this.scene.start('GameScene', { classLevel: cls, mode: this.mode });
      }, { width: 112, height: 92, fontSize: 50, fill: junior ? 0xffd23f : 0x9be15d, shade: junior ? 0xd19c00 : 0x5e9c2a });
    });
    this.add.text(W / 2 - 210, 386, 'Class 3–5', { fontFamily: font, fontSize: '22px', color: C.textDim }).setOrigin(0.5);
    this.add.text(W / 2 + 210, 386, 'Class 6–8 · bigger jams, up to 8×8', { fontFamily: font, fontSize: '22px', color: C.textDim }).setOrigin(0.5);

    this.add.text(W / 2, 466, 'Difficulty', { fontFamily: font, fontSize: '26px', color: C.text, fontStyle: '700' }).setOrigin(0.5);
    this.fixedBtn = new TextButton(this, W / 2 - 140, 526, 'Fixed', () => this.setMode('fixed'), { width: 240, height: 60, fontSize: 26 });
    this.adaptBtn = new TextButton(this, W / 2 + 140, 526, 'Adaptive', () => this.setMode('adaptive'), { width: 240, height: 60, fontSize: 26 });
    this.modeNote = this.add.text(W / 2, 590, '', { fontFamily: font, fontSize: '22px', color: C.textDim, align: 'center' }).setOrigin(0.5);
    this.setMode(this.mode, true);

    const muteBtn = new TextButton(this, W - 70, 40, sound.muted ? 'Sound: off' : 'Sound: on', () => {
      sound.setMuted(!sound.muted);
      muteBtn.setLabel(sound.muted ? 'Sound: off' : 'Sound: on');
      sound.tap();
    }, { width: 120, height: 44, fontSize: 18, fill: C.btnDark, shade: C.btnDarkShade, color: '#ffffff' });
  }

  setMode(mode, silent) {
    const C = GameConfig.COLORS;
    this.mode = mode;
    this.registry.get('storage').set('mode', mode);
    if (!silent) this.registry.get('sfx').tap();
    const on = { fill: 0xffd23f, shade: 0xd19c00, color: '#1d2a33' };
    const off = { fill: C.btnDark, shade: C.btnDarkShade, color: '#ffffff' };
    [[this.fixedBtn, 'fixed'], [this.adaptBtn, 'adaptive']].forEach(([b, m]) => {
      Object.assign(b.opts, mode === m ? on : off);
      b.label.setColor(b.opts.color);
      b.draw(0);
    });
    this.modeNote.setText(mode === 'fixed'
      ? 'Same difficulty curve every time. Best for comparing results.'
      : 'Jams get easier or harder based on how you play.');
  }
}
