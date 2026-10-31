/**
 * MoveMarkers
 * When a vehicle is selected, lights up the free cells of its lane with
 * glowing pads and arrows pointing the way it can drive, and shows a faded
 * copy of the vehicle where it would stop ("focus"). VehicleControls drives
 * the vehicle there when a lit cell is clicked or tapped (see deltaAt).
 *
 * A cell maps to a stop the way people expect: pick a cell ahead and the
 * vehicle's front stops on it; pick a cell behind and its back stops on it.
 */
class MoveMarkers {
  constructor(scene) {
    this.scene = scene;
    this.locked = false; // true while a swipe or the keyboard is choosing the stop
    this.items = [];
    this.ghost = null;
    this.zone = null;
    this.sprite = null;
    this.focusDelta = 0;
  }

  get active() { return !!this.sprite; }

  /** Light up the lane of `sprite`. range = { back, fwd } in cells. */
  show(sprite, pos, range) {
    this.clear();
    const s = this.scene;
    const v = sprite.vehicle;
    const B = sprite.board;
    this.sprite = sprite;
    this.pos = pos;
    this.range = range;
    const cell = B.cell;
    const centreOfCell = c => {
      const along = (c + 0.5) * cell;
      const across = (v.lane + 0.5) * cell;
      return v.horiz ? { x: B.x + along, y: B.y + across } : { x: B.x + across, y: B.y + along };
    };
    const pad = Math.round(cell * 0.8);
    const halo = GlowFx.halo(s, pad, pad, GlowFx.SELECT, Math.round(cell * 0.16));
    const addPad = (c, dir, k) => {
      const p = centreOfCell(c);
      const img = s.add.image(p.x, p.y, halo.key).setDisplaySize(pad + halo.pad * 2, pad + halo.pad * 2)
        .setAlpha(0).setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
      s.tweens.add({ targets: img, alpha: { from: 0, to: 0.38 }, duration: 160, delay: k * 35 });
      const arrow = s.add.text(p.x, p.y, '▶', {
        fontFamily: GameConfig.FONT, fontSize: Math.round(cell * 0.42) + 'px', color: '#fff6c8'
      }).setOrigin(0.5).setDepth(8).setAlpha(0);
      arrow.setAngle(v.horiz ? (dir > 0 ? 0 : 180) : (dir > 0 ? 90 : -90));
      s.tweens.add({ targets: arrow, alpha: 0.9, duration: 160, delay: k * 35 });
      // a gentle nudge along the direction of travel
      const nx = v.horiz ? dir * 5 : 0;
      const ny = v.horiz ? 0 : dir * 5;
      s.tweens.add({ targets: arrow, x: p.x + nx, y: p.y + ny, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: k * 35 });
      this.items.push(img, arrow);
    };
    for (let k = 1; k <= range.fwd; k++) addPad(pos + v.len - 1 + k, 1, k);
    for (let k = 1; k <= range.back; k++) addPad(pos - k, -1, k);

    // one hit zone over the whole reachable stretch of the lane (vehicle included)
    const first = pos - range.back;
    const last = pos + v.len - 1 + range.fwd;
    const a = centreOfCell(first);
    const b = centreOfCell(last);
    const w = v.horiz ? (last - first + 1) * cell : cell;
    const h = v.horiz ? cell : (last - first + 1) * cell;
    this.zone = s.add.zone((a.x + b.x) / 2, (a.y + b.y) / 2, w, h).setDepth(25).setInteractive({ useHandCursor: true });
    this.zone.on('pointermove', p => { if (!this.locked) this.focus(this.deltaAt(p)); });
    this.zone.on('pointerout', () => { if (!this.locked) this.focus(0); });
    this.focus(0);
  }

  /** Lane cell under a pointer → how far the vehicle should drive. */
  deltaAt(pointer) {
    const v = this.sprite.vehicle;
    const B = this.sprite.board;
    const c = Math.floor(((v.horiz ? pointer.worldX - B.x : pointer.worldY - B.y)) / B.cell);
    if (c >= this.pos + v.len) return Math.min(this.range.fwd, c - (this.pos + v.len - 1));
    if (c < this.pos) return -Math.min(this.range.back, this.pos - c);
    return 0;
  }

  /** Show the faded copy where the vehicle would stop (0 = none). */
  focus(delta) {
    if (!this.sprite) return;
    const d = Math.max(-this.range.back, Math.min(this.range.fwd, delta));
    this.focusDelta = d;
    if (this.ghost) { this.ghost.destroy(); this.ghost = null; }
    if (!d) return;
    const sp = this.sprite;
    const c = sp.centreFor(this.pos + d);
    const g = this.scene.add.image(c.x, c.y, sp.vehicle.kind).setDepth(9).setAlpha(0.5);
    g.setDisplaySize(sp.boxW, sp.boxH);
    if (!sp.vehicle.horiz) g.setAngle(90);
    this.ghost = g;
  }

  /** Move the focus one cell (keyboard). */
  step(dir) {
    this.focus(this.focusDelta + dir);
  }

  clear() {
    this.items.forEach(o => { this.scene.tweens.killTweensOf(o); o.destroy(); });
    this.items = [];
    if (this.ghost) { this.ghost.destroy(); this.ghost = null; }
    if (this.zone) { this.zone.destroy(); this.zone = null; }
    this.sprite = null;
    this.focusDelta = 0;
    this.locked = false;
  }
}
