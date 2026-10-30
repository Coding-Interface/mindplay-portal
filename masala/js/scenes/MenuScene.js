/**
 * MenuScene
 * Title over the kitchen, class picker (3–8) and difficulty mode.
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
    const sound = this.registry.get('sound');
    this.mode = storage.get('mode', 'fixed');

    this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45);
    // decorative jars
    [['abab', 120, 430], ['cdcd', 1160, 430]].forEach(([j, x, y]) => {
      const s = 0.62;
      this.add.image(x, y, 'jar4_back').setOrigin(0.5, 0).setScale(s);
      j.split('').forEach((c, k) => this.add.image(x, y + (60 + (3 - k) * 50 + 25) * s, 'scoop_' + SpiceTable.get(c.charCodeAt(0) - 97).key).setDisplaySize(100 * s, 50 * s));
      this.add.image(x, y, 'jar4_front').setOrigin(0.5, 0).setScale(s);
    });

    this.add.text(W / 2, 80, 'Masala Dabba Sort', { fontFamily: font, fontSize: '80px', color: C.text, fontStyle: '800' })
      .setOrigin(0.5).setShadow(0, 6, '#000000', 0, false, true);
    this.add.text(W / 2, 146, 'The spices got mixed up! Pour them back so every jar holds one spice.', {
      fontFamily: font, fontSize: '27px', color: C.textDim
    }).setOrigin(0.5);

    this.add.text(W / 2, 240, 'Which class are you in?', { fontFamily: font, fontSize: '32px', color: C.text, fontStyle: '700' }).setOrigin(0.5);
    [3, 4, 5, 6, 7, 8].forEach((cls, i) => {
      const junior = cls <= 5;
      new TextButton(this, W / 2 + (i - 2.5) * 140, 322, String(cls), () => {
        sound.tap();
        this.scene.start('GameScene', { classLevel: cls, mode: this.mode });
      }, { width: 112, height: 92, fontSize: 50, fill: junior ? 0xffd23f : 0x9be15d, shade: junior ? 0xd19c00 : 0x5e9c2a });
    });
    this.add.text(W / 2 - 210, 390, 'Class 3–5', { fontFamily: font, fontSize: '22px', color: C.textDim }).setOrigin(0.5);
    this.add.text(W / 2 + 210, 390, 'Class 6–8 · frosted jars', { fontFamily: font, fontSize: '22px', color: C.textDim }).setOrigin(0.5);

    this.add.text(W / 2, 474, 'Difficulty', { fontFamily: font, fontSize: '26px', color: C.text, fontStyle: '700' }).setOrigin(0.5);
    this.fixedBtn = new TextButton(this, W / 2 - 140, 536, 'Fixed', () => this.setMode('fixed'), { width: 240, height: 60, fontSize: 26 });
    this.adaptBtn = new TextButton(this, W / 2 + 140, 536, 'Adaptive', () => this.setMode('adaptive'), { width: 240, height: 60, fontSize: 26 });
    this.modeNote = this.add.text(W / 2, 602, '', { fontFamily: font, fontSize: '22px', color: C.textDim, align: 'center' }).setOrigin(0.5);
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
    if (!silent) this.registry.get('sound').tap();
    const on = { fill: 0xffd23f, shade: 0xd19c00, color: '#2b1d10' };
    const off = { fill: C.btnDark, shade: C.btnDarkShade, color: '#ffffff' };
    [[this.fixedBtn, 'fixed'], [this.adaptBtn, 'adaptive']].forEach(([b, m]) => {
      Object.assign(b.opts, mode === m ? on : off);
      b.label.setColor(b.opts.color);
      b.draw(0);
    });
    this.modeNote.setText(mode === 'fixed'
      ? 'Same difficulty curve every time. Best for comparing results.'
      : 'Shelves get easier or harder based on how you play.');
  }
}
