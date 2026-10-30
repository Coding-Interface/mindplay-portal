/**
 * SummaryScene
 * End-of-session report for the child (stars) and the teacher (planning data).
 */
class SummaryScene extends Phaser.Scene {
  constructor() {
    super('SummaryScene');
  }

  init(data) {
    this.session = data.session;
    this.classLevel = data.classLevel;
    this.mode = data.mode;
  }

  create() {
    const W = this.scale.width;
    const C = GameConfig.COLORS;
    const font = GameConfig.FONT;
    const s = this.session.summary;
    this.add.image(W / 2, this.scale.height / 2, 'bg').setDisplaySize(W, this.scale.height);
    this.add.rectangle(W / 2, this.scale.height / 2, W, this.scale.height, 0x000000, 0.55);

    this.add.text(W / 2, 56, 'The school van is in! Great planning!', {
      fontFamily: font, fontSize: '60px', color: C.text, fontStyle: '800'
    }).setOrigin(0.5);
    this.add.image(W / 2 - 70, 126, 'star').setDisplaySize(56, 56);
    this.add.text(W / 2 - 36, 126, s.stars + ' / ' + s.maxStars, {
      fontFamily: font, fontSize: '40px', color: C.text, fontStyle: '700'
    }).setOrigin(0, 0.5);

    // stat tiles
    const tiles = [
      ['Planning score', s.planningScore + '%', 'how close to the best plan'],
      ['Perfect plans', s.perfectPlans + ' / ' + s.levelsPlayed, 'solved in the fewest moves'],
      ['Think time', (s.avgPlanningTimeMs / 1000).toFixed(1) + ' s', 'before the first move'],
      ['Blocked tries', String(s.totalBlocked), 'dragged a boxed-in vehicle']
    ];
    tiles.forEach((t, i) => {
      const x = W / 2 + (i - 1.5) * 290;
      const g = this.add.graphics();
      g.fillStyle(C.panel, 1).fillRoundedRect(x - 130, 172, 260, 130, 20);
      this.add.text(x, 198, t[0], { fontFamily: font, fontSize: '22px', color: C.textDim }).setOrigin(0.5);
      this.add.text(x, 240, t[1], { fontFamily: font, fontSize: '42px', color: C.text, fontStyle: '800' }).setOrigin(0.5);
      this.add.text(x, 280, t[2], { fontFamily: font, fontSize: '17px', color: C.textDim }).setOrigin(0.5);
    });

    // per-level table
    const top = 330;
    const cols = [
      ['Level', 140], ['Stars', 250], ['Moves', 370], ['Best', 470], ['Think (s)', 590],
      ['Undos', 710], ['Restarts', 820], ['Hints', 930], ['Blocked', 1050]
    ];
    const g = this.add.graphics();
    g.fillStyle(C.panel, 1).fillRoundedRect(80, top - 6, W - 160, 300, 18);
    cols.forEach(([h, x]) => this.add.text(x, top + 12, h, { fontFamily: font, fontSize: '20px', color: C.textDim, fontStyle: '700' }).setOrigin(0.5));
    this.session.levels.forEach((l, r) => {
      const y = top + 42 + r * 26;
      const vals = [
        l.level, l.skipped ? 'skipped' : '★'.repeat(l.stars) + '☆'.repeat(3 - l.stars), l.moves, l.optimal,
        l.planningTimeMs === null ? '–' : (l.planningTimeMs / 1000).toFixed(1),
        l.undos, l.restarts, l.hints, l.blockedAttempts
      ];
      vals.forEach((v, i) => this.add.text(cols[i][1], y, String(v), {
        fontFamily: font, fontSize: '20px', color: i === 1 ? '#ffd23f' : C.text
      }).setOrigin(0.5));
    });

    // buttons
    const y = 672;
    new TextButton(this, W / 2 - 320, y, 'Play again', () => this.scene.start('GameScene', { classLevel: this.classLevel, mode: this.mode }), { width: 260 });
    new TextButton(this, W / 2, y, 'Change class', () => this.scene.start('MenuScene'), { width: 260, fill: C.btnDark, shade: C.btnDarkShade, color: '#ffffff' });
    new TextButton(this, W / 2 + 320, y, 'Download report', () => this.download(), { width: 260, fill: 0x9be15d, shade: 0x5e9c2a });
  }

  download() {
    const json = JSON.stringify(this.session, null, 2);
    // copy as well: some embedded frames block file downloads
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(() => this.toast('Report saved and copied to clipboard'), () => this.toast('Report saved'));
      } else {
        this.toast('Report saved');
      }
    } catch (e) { /* ignore */ }
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'auto-out-report-' + this.session.sessionId + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      console.log(json);
    }
  }

  toast(msg) {
    if (this.toastText) this.toastText.destroy();
    this.toastText = this.add.text(this.scale.width / 2, 620, msg, {
      fontFamily: GameConfig.FONT, fontSize: '22px', color: '#0f3d42', backgroundColor: '#9be15d', padding: { x: 14, y: 6 }
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 2200, duration: 400 });
  }
}
