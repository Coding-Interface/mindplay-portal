/**
 * LotView
 * Draws the parking lot for one level on top of the street background:
 * asphalt sized to the lot (6×6, 7×7 or 8×8), painted parking lines, black-and-
 * yellow kerbs with a gap at the gate row, the driveway across the footpath,
 * the school gate (two pillars and two steel leaves) and a pulsing arrow.
 * Everything is rebuilt when the lot size changes; openGate() swings the
 * leaves open when the school van is free.
 */
class LotView {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.leaves = [];
  }

  build(B) {
    this.clear();
    const s = this.scene;
    const S = GameConfig.SCENE;
    const L = GameConfig.LOT;
    const add = o => { this.items.push(o); return o; };
    const gateY = B.y + B.gateRow * B.cell;
    const gateMid = gateY + B.cell / 2;
    const right = B.x + B.px;

    // asphalt (covers the whole lot square, so a smaller lot leaves no gap)
    add(s.add.tileSprite(L.x + L.side / 2, L.y + L.side / 2, L.side + 12, L.side + 12, 'road')
      .setTileScale(0.75).setDepth(-4));

    // driveway from the lot, across the footpath and through the gate
    const driveEnd = S.campus.x + 150;
    add(s.add.tileSprite((right + driveEnd) / 2, gateMid, driveEnd - right, B.cell, 'road')
      .setTileScale(0.75).setDepth(-4));
    add(s.add.rectangle((right + driveEnd) / 2, gateY + 2, driveEnd - right, 4, 0xffffff, 0.5).setDepth(-3));
    add(s.add.rectangle((right + driveEnd) / 2, gateY + B.cell - 2, driveEnd - right, 4, 0xffffff, 0.5).setDepth(-3));

    // painted lines: dashed cell grid and the van's lane in yellow
    const g = add(s.add.graphics().setDepth(-3));
    g.fillStyle(0xffd23f, 0.1).fillRect(B.x, gateY, B.px, B.cell);
    g.lineStyle(2, 0xffffff, 0.22);
    const dash = Math.max(6, B.cell / 6);
    for (let i = 1; i < B.size; i++) {
      for (let t = 0; t < B.px; t += dash * 2) {
        const len = Math.min(dash, B.px - t);
        g.lineBetween(B.x + i * B.cell, B.y + t, B.x + i * B.cell, B.y + t + len);
        g.lineBetween(B.x + t, B.y + i * B.cell, B.x + t + len, B.y + i * B.cell);
      }
    }
    // chevrons pointing to the gate
    g.fillStyle(0xffd23f, 0.32);
    for (let k = 0; k < 3; k++) {
      const cx = right - B.cell * 0.3 - k * B.cell * 0.28;
      const h = B.cell * 0.22;
      g.fillTriangle(cx, gateMid, cx - h, gateMid - h, cx - h, gateMid + h);
    }

    // kerbs around the lot (gap at the gate on the right)
    const k = 14;
    const kerb = (x, y, w, h, vertical) => {
      const t = add(s.add.tileSprite(x, y, vertical ? h : w, k, 'curb').setDepth(-2));
      if (vertical) t.setAngle(90);
      return t;
    };
    kerb(B.x + B.px / 2, B.y - k / 2, B.px + 2 * k, k, false);
    kerb(B.x + B.px / 2, B.y + B.px + k / 2, B.px + 2 * k, k, false);
    kerb(B.x - k / 2, B.y + B.px / 2, k, B.px, true);
    const upper = gateY - B.y;
    const lower = B.y + B.px - (gateY + B.cell);
    if (upper > 0) kerb(right + k / 2, B.y + upper / 2, k, upper, true);
    if (lower > 0) kerb(right + k / 2, gateY + B.cell + lower / 2, k, lower, true);

    // the gate in the school wall
    const wallX = S.wall.x + S.wall.w / 2;
    const pin = 22;
    add(s.add.image(wallX, gateY - pin / 2, 'pillar').setDisplaySize(pin * 1.5, pin * 1.5).setDepth(6));
    add(s.add.image(wallX, gateY + B.cell + pin / 2, 'pillar').setDisplaySize(pin * 1.5, pin * 1.5).setDepth(6));
    const leafLen = B.cell / 2;
    this.leaves = [
      { img: add(s.add.image(wallX, gateY, 'gateleaf').setOrigin(0, 0.5).setDisplaySize(leafLen, 9).setAngle(90).setDepth(5)), open: -10 },
      { img: add(s.add.image(wallX, gateY + B.cell, 'gateleaf').setOrigin(0, 0.5).setDisplaySize(leafLen, 9).setAngle(-90).setDepth(5)), open: 10 }
    ];

    // arrow on the driveway
    const arrow = add(s.add.text(S.footpathRight.x + S.footpathRight.w / 2 - 6, gateMid, '▶', {
      fontFamily: GameConfig.FONT, fontSize: Math.round(B.cell * 0.45) + 'px', color: '#ffd23f'
    }).setOrigin(0.5).setDepth(-1).setShadow(0, 2, '#000000', 4, false, true));
    this.arrowTween = s.tweens.add({ targets: arrow, x: arrow.x + 10, duration: 520, yoyo: true, repeat: -1 });
    this.arrow = arrow;

    this.gateOpen = false;
    this.B = B;
  }

  /** Swing both gate leaves into the campus. */
  openGate() {
    if (this.gateOpen) return;
    this.gateOpen = true;
    if (this.arrow) this.arrow.setVisible(false);
    this.leaves.forEach(l => this.scene.tweens.add({ targets: l.img, angle: l.open, duration: 520, ease: 'Back.easeOut' }));
  }

  clear() {
    if (this.arrowTween) { this.arrowTween.stop(); this.arrowTween = null; }
    this.items.forEach(o => o.destroy());
    this.items = [];
    this.leaves = [];
  }
}
