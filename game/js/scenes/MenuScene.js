/**
 * MenuScene
 * Pick the story (theme), your class (3–8) and the difficulty mode.
 */
class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width } = this.scale;
    const storage = this.registry.get('storage');
    const sound = this.registry.get('sound');
    const T = ThemeRegistry.current;
    const C = T.colors;
    const font = GameConfig.FONT;
    this.mode = storage.get('mode', 'fixed');
    T.addBackground(this, 0.45);
    T.addAmbience(this);

    this.decorate(T);

    this.add.text(width / 2, 70, T.name, {
      fontFamily: font, fontSize: '76px', color: C.text, fontStyle: '800'
    }).setOrigin(0.5).setShadow(0, 6, '#000000', 0, false, true);
    this.add.text(width / 2, 132, T.tagline, {
      fontFamily: font, fontSize: '26px', color: C.textDim, align: 'center', wordWrap: { width: 900 }
    }).setOrigin(0.5);

    // theme picker: one button per real-life story
    const themes = ThemeRegistry.all();
    const bw = themes.length > 2 ? 268 : 290;
    const gap = bw + 22;
    themes.forEach((t, i) => {
      const x = width / 2 + (i - (themes.length - 1) / 2) * gap;
      const active = t.id === T.id;
      const style = { width: bw, height: 58, fontSize: 23 };
      const btn = new TextButton(this, x, 206, t.name, () => {
        if (active) return;
        sound.tap();
        ThemeRegistry.use(t.id);
        storage.set('theme', t.id);
        this.scene.restart();
      }, active ? style : T.darkButton(style));
      const icon = this.add.image(0, 0, t.key('crate1')).setDisplaySize(38, 38);
      if (!active) icon.setAlpha(0.85);
      btn.add(icon);
      icon.setPosition(-bw / 2 + 28, -3);
      btn.label.setX(18);
    });

    this.add.text(width / 2, 290, 'Which class are you in?', {
      fontFamily: font, fontSize: '32px', color: C.text, fontStyle: '700'
    }).setOrigin(0.5);

    [3, 4, 5, 6, 7, 8].forEach((cls, i) => {
      const junior = cls <= 5;
      const x = width / 2 + (i - 2.5) * 150;
      new TextButton(this, x, 370, String(cls), () => {
        sound.tap();
        this.scene.start('GameScene', { classLevel: cls, mode: this.mode });
      }, {
        width: 120, height: 92, fontSize: 52,
        fill: junior ? 0xffd23f : 0x9be15d,
        shade: junior ? 0xd19c00 : 0x5e9c2a
      });
    });
    this.add.text(width / 2 - 225, 438, 'Class 3–5', { fontFamily: font, fontSize: '22px', color: C.textDim }).setOrigin(0.5);
    this.add.text(width / 2 + 225, 438, 'Class 6–8 · colour rule', { fontFamily: font, fontSize: '22px', color: C.textDim }).setOrigin(0.5);

    // mode toggle
    this.add.text(width / 2, 512, 'Difficulty', {
      fontFamily: font, fontSize: '26px', color: C.text, fontStyle: '700'
    }).setOrigin(0.5);
    this.fixedBtn = new TextButton(this, width / 2 - 140, 572, 'Fixed', () => this.setMode('fixed'), { width: 240, height: 60, fontSize: 26 });
    this.adaptBtn = new TextButton(this, width / 2 + 140, 572, 'Adaptive', () => this.setMode('adaptive'), { width: 240, height: 60, fontSize: 26 });
    this.modeNote = this.add.text(width / 2, 636, '', {
      fontFamily: font, fontSize: '22px', color: C.textDim, align: 'center'
    }).setOrigin(0.5);
    this.setMode(this.mode, true);

    this.addMuteButton(T);
  }

  setMode(mode, silent) {
    const T = ThemeRegistry.current;
    this.mode = mode;
    this.registry.get('storage').set('mode', mode);
    if (!silent) this.registry.get('sound').tap();
    const on = { fill: 0xffd23f, shade: 0xd19c00, color: '#1d2a33' };
    const off = { fill: T.colors.btnDark, shade: T.colors.btnDarkShade, color: '#ffffff' };
    Object.assign(this.fixedBtn.opts, mode === 'fixed' ? on : off);
    Object.assign(this.adaptBtn.opts, mode === 'adaptive' ? on : off);
    this.fixedBtn.label.setColor(this.fixedBtn.opts.color);
    this.adaptBtn.label.setColor(this.adaptBtn.opts.color);
    this.fixedBtn.draw(0);
    this.adaptBtn.draw(0);
    this.modeNote.setText(mode === 'fixed'
      ? 'Same difficulty curve every time. Best for comparing results.'
      : 'Levels get easier or harder based on how you play.');
  }

  addMuteButton(T) {
    const sound = this.registry.get('sound');
    const btn = new TextButton(this, this.scale.width - 70, 40, sound.muted ? 'Sound: off' : 'Sound: on', () => {
      sound.setMuted(!sound.muted);
      btn.setLabel(sound.muted ? 'Sound: off' : 'Sound: on');
      sound.tap();
    }, T.darkButton({ width: 120, height: 44, fontSize: 18 }));
  }

  decorate(T) {
    const spots = [[110, 560, 'crate0'], [210, 650, 'hole0'], [1150, 560, 'crate2'], [1060, 650, 'hole1'], [120, 330, 'wall0'], [1160, 330, 'crate1']];
    spots.forEach(([x, y, key], i) => {
      const img = this.add.image(x, y, T.key(key)).setDisplaySize(90, 90).setAlpha(0.4);
      this.tweens.add({ targets: img, y: y - 12, duration: 1600 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }
}
