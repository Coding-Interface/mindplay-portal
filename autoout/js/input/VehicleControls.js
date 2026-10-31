/**
 * VehicleControls
 * Every way to move a vehicle in Get the Auto Out. All of them end in
 * scene.commitMove(id, delta), so a slide of any length is still one move.
 *
 * Swipe (touch or mouse):
 *   swipe a vehicle along its lane and let go: it drives that way.
 *   - a quick flick (fast, under 0.3 s) drives as far as it can go
 *   - a slower swipe drives about as many cells as your finger travelled
 *   While swiping, the lane lights up and a faded copy shows where it will stop.
 *
 * Tap / click:
 *   tap a vehicle to select it: its free lane cells glow. Tap a glowing cell
 *   and the vehicle drives there (its front stops on a cell ahead, its back on a
 *   cell behind). Tap it again, or anywhere else, to cancel.
 *   Mouse users also get a hover highlight and a preview while hovering a cell.
 *
 * Keyboard:
 *   arrow keys pick a vehicle (the school van first, then the nearest vehicle in
 *   that direction) and step the stop along its lane; Enter or Space drives;
 *   Tab cycles vehicles; Esc cancels; H hint; Ctrl/Cmd+Z undo.
 *
 * The scene provides: busy, board, sprites, B, sfx, cop, metrics,
 * commitMove(id, delta), tapBlocker(sprite), boxedIn(sprite), wrongWay(sprite),
 * blockedSwipe(sprite), hint(), undo().
 */
class VehicleControls {
  constructor(scene) {
    this.scene = scene;
    this.markers = new MoveMarkers(scene);
    this.selected = null;
    this.gesture = null;
    const input = scene.input;

    input.on('gameobjectdown', (p, obj) => this.down(p, obj));
    input.on('pointerdown', (p, over) => { if (!over.length && !this.gesture) this.deselect(); });
    input.on('pointermove', p => this.move(p));
    input.on('pointerup', p => this.up(p));
    input.on('pointerupoutside', p => this.up(p));
    input.on('gameobjectover', (p, obj) => { if (this.isMovable(obj)) obj.setHover(true); });
    input.on('gameobjectout', (p, obj) => { if (obj instanceof VehicleSprite) obj.setHover(false); });

    if (input.keyboard) {
      input.keyboard.on('keydown', e => this.key(e));
      // keep the page from scrolling on arrows / space while playing
      input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE,TAB');
    }
  }

  isMovable(obj) {
    return obj instanceof VehicleSprite && !obj.vehicle.fixed;
  }

  // ---------------------------------------------------------------- pointer

  down(pointer, obj) {
    const s = this.scene;
    if (s.busy || this.gesture) return;
    if (obj === this.markers.zone) {
      // pressing the lit lane: on the vehicle itself it may be a swipe, elsewhere it picks a stop
      const d = this.markers.deltaAt(pointer);
      if (d === 0) this.startGesture(this.selected, pointer);
      else this.gesture = { kind: 'pick' };
      return;
    }
    if (!(obj instanceof VehicleSprite)) return;
    if (obj.vehicle.fixed) {
      s.tapBlocker(obj);
      return;
    }
    this.startGesture(obj, pointer);
  }

  startGesture(sprite, pointer) {
    this.gesture = {
      kind: 'vehicle', sprite, x0: pointer.worldX, y0: pointer.worldY, t0: pointer.downTime, swiping: false,
      samples: [{ t: pointer.downTime, x: pointer.worldX, y: pointer.worldY }]
    };
  }

  move(pointer) {
    const g = this.gesture;
    if (!g || g.kind !== 'vehicle' || this.scene.busy) return;
    const dx = pointer.worldX - g.x0;
    const dy = pointer.worldY - g.y0;
    g.samples.push({ t: pointer.moveTime || pointer.time, x: pointer.worldX, y: pointer.worldY });
    if (g.samples.length > 24) g.samples.shift();
    if (!g.swiping && Math.hypot(dx, dy) < 14) return;
    const s = this.scene;
    const sp = g.sprite;
    if (!g.swiping) {
      g.swiping = true;
      // light up its lane while the swipe is in progress
      if (this.selected !== sp) this.select(sp, true);
      this.markers.locked = true;
    }
    if (!this.markers.active) return;
    const lane = sp.vehicle.horiz ? dx : dy;
    const r = this.markers.range;
    const dir = Math.sign(lane);
    const avail = dir > 0 ? r.fwd : r.back;
    if (!dir || !avail) { this.markers.focus(0); return; }
    const cells = Math.max(1, Math.min(avail, Math.round(Math.abs(lane) / s.B.cell)));
    this.markers.focus(dir * cells);
  }

  up(pointer) {
    const g = this.gesture;
    this.gesture = null;
    if (!g || this.scene.busy) return;
    if (g.kind === 'pick') {
      if (!this.selected) return;
      const d = this.markers.deltaAt(pointer);
      if (d) this.drive(this.selected, d);
      else this.deselect();
      return;
    }
    if (!g.swiping) {
      // a tap: select, or cancel if it was already selected
      if (this.selected === g.sprite) this.deselect();
      else this.select(g.sprite);
      return;
    }
    this.finishSwipe(g, pointer);
  }

  finishSwipe(g, pointer) {
    const s = this.scene;
    const sp = g.sprite;
    const v = sp.vehicle;
    const dx = pointer.worldX - g.x0;
    const dy = pointer.worldY - g.y0;
    const lane = v.horiz ? dx : dy;
    const across = v.horiz ? dy : dx;
    // timed from the pointer's own event timestamps, not from when Phaser processed them
    const dt = Math.max(1, (pointer.upTime || pointer.time) - g.t0);
    this.markers.locked = false;
    if (Math.abs(lane) < Math.abs(across) * 0.6 && Math.abs(lane) < s.B.cell * 0.4) {
      this.deselect();
      s.wrongWay(sp);
      return;
    }
    const r = s.board.range(v.id);
    const dir = Math.sign(lane);
    const avail = dir > 0 ? r.fwd : r.back;
    if (!avail) {
      this.deselect();
      if (r.back + r.fwd === 0) s.boxedIn(sp);
      else s.blockedSwipe(sp);
      return;
    }
    // A flick is judged by its speed at the end (px per ms along the lane, over the
    // last 120 ms), so a pause before flicking still counts. A short, quick gesture
    // also counts, because fingers on small screens travel little.
    const up = pointer.upTime || pointer.time;
    const ref = g.samples.find(p => p.t >= up - 120) || g.samples[0];
    const span = Math.max(16, up - ref.t);
    const endLane = v.horiz ? pointer.worldX - ref.x : pointer.worldY - ref.y;
    const endSpeed = Math.abs(endLane) / span;
    const flick = (endSpeed > 0.6 && Math.sign(endLane) === Math.sign(lane)) || (dt < 300 && Math.abs(lane) / dt > 0.35);
    const cells = flick ? avail : Math.max(1, Math.min(avail, Math.round(Math.abs(lane) / s.B.cell)));
    s.sfx.whoosh();
    this.drive(sp, dir * cells);
  }

  // ---------------------------------------------------------------- selection

  /** Select a vehicle and light up its lane. Returns false if it cannot move at all. */
  select(sprite, quiet) {
    const s = this.scene;
    this.deselect();
    const r = s.board.range(sprite.vehicle.id);
    if (r.back + r.fwd === 0) {
      s.boxedIn(sprite);
      return false;
    }
    this.selected = sprite;
    sprite.setHover(false);
    sprite.setGlow(true, GlowFx.SELECT);
    sprite.setDepth(20);
    this.markers.show(sprite, s.board.pos[sprite.vehicle.id], r);
    if (!quiet) s.sfx.tap();
    return true;
  }

  deselect() {
    if (this.selected) {
      this.selected.setGlow(false);
      this.selected.setDepth(this.scene.restDepth(this.selected.vehicle));
    }
    this.selected = null;
    this.markers.clear();
  }

  /** Hint: select the vehicle, glow green, and preview its best move (Enter or a tap drives it). */
  showHint(sprite, delta) {
    if (!this.select(sprite, true)) return;
    sprite.setGlow(true, GlowFx.HINT);
    this.markers.locked = true;
    this.markers.focus(delta);
  }

  drive(sprite, delta) {
    this.deselect();
    this.scene.commitMove(sprite.vehicle.id, delta);
  }

  reset() {
    this.gesture = null;
    this.deselect();
  }

  // ---------------------------------------------------------------- keyboard

  key(e) {
    const s = this.scene;
    if (s.busy) return;
    const k = e.key;
    if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { s.undo(); return; }
    if (k === 'h' || k === 'H') { s.hint(); return; }
    if (k === 'Escape') { this.deselect(); return; }
    if (k === 'Tab') { this.cycle(e.shiftKey ? -1 : 1); return; }
    if (k === 'Enter' || k === ' ') {
      if (this.selected && this.markers.focusDelta) this.drive(this.selected, this.markers.focusDelta);
      return;
    }
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = dirs[k];
    if (!d) return;
    if (!this.selected) {
      this.select(s.sprites[0]) || this.cycle(1);
      return;
    }
    const v = this.selected.vehicle;
    const along = v.horiz ? d[0] : d[1];
    if (along) {
      this.markers.locked = true;
      this.markers.step(along);
      s.sfx.tap();
    } else {
      this.selectToward(d[0], d[1]);
    }
  }

  /** Movable vehicles that are not boxed in, in board order. */
  candidates() {
    const s = this.scene;
    const g = s.board.grid();
    return s.sprites.filter(sp => {
      if (sp.vehicle.fixed) return false;
      const r = s.board.range(sp.vehicle.id, g);
      return r.back + r.fwd > 0;
    });
  }

  cycle(step) {
    const list = this.candidates();
    if (!list.length) return false;
    const i = list.indexOf(this.selected);
    const next = list[(i + step + list.length) % list.length];
    return this.select(next);
  }

  /** Select the nearest movable vehicle in a screen direction from the current one. */
  selectToward(dx, dy) {
    const from = this.selected;
    let best = null;
    let bestScore = Infinity;
    this.candidates().forEach(sp => {
      if (sp === from) return;
      const vx = sp.x - from.x;
      const vy = sp.y - from.y;
      const forward = vx * dx + vy * dy;
      if (forward <= 4) return;
      const side = Math.abs(vx * dy - vy * dx);
      const score = forward + side * 2;
      if (score < bestScore) { bestScore = score; best = sp; }
    });
    if (best) this.select(best);
  }
}
