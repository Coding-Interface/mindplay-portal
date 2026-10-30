/**
 * ParkingTheme — "Park It!"
 * A basement car park with mechanical parking lifts. A vehicle drives straight
 * until a pillar, barrier, planter or another vehicle stops it, or until it
 * reaches the first free lift meant for it. The lift lowers it underground
 * and closes flush with the floor, so other vehicles can drive over it.
 *
 *  crate  -> vehicle (red hatchback = any lift, orange scooter ●, blue SUV ▲)
 *  hole   -> open parking lift (any, two-wheeler ●, car ▲)
 *  wall   -> concrete pillar, water-filled barrier, planter
 *  filled -> closed lift, green lamp on
 * Art: assets/parking/ (code-drawn fallbacks below are used if a file is missing).
 */
class ParkingTheme extends BaseTheme {
  constructor() {
    super();
    this.id = 'parking';
    this.name = 'Park It!';
    this.tagline = 'The mall is opening! Drive every vehicle onto the first free parking lift on its way.';
    this.wallVariants = 3;
    this.extraAssets = [['fullsign', 'png']];
    this.movesLabel = 'Moves';
    this.words = {
      crate: 'vehicle', crates: 'vehicles', hole: 'parking lift', holes: 'parking lifts', wall: 'obstacle', walls: 'obstacles'
    };
    this.colorWords = {
      colorRule: 'New rule: scooters (●) park only on two-wheeler lifts, cars (▲) only on car lifts.',
      colorPass: 'A vehicle drives straight over a lift that is not meant for it.'
    };
    this.colors = {
      bg: 0x3c4146,
      panel: 0x1f2326,
      panelLine: 0xf2c230,
      tipBg: '#2c3135',
      tipWarn: '#a8321f',
      text: '#ffffff',
      textDim: '#d6dadd',
      dotEmpty: 0x50565b,
      btnDark: 0x50565b,
      btnDarkShade: 0x33383c
    };
    this.summaryHeading = 'Parking full! Great planning!';
    this.vehicleColors = [0xd63b30, 0xff8a3d, 0x2f7ccc];
    this.liftColors = [0xf2c230, 0xff8a3d, 0x3d8ee0];
  }

  levelIntro(best) {
    return 'The mall opens soon! Fill every parking lift in ' + best + ' moves.';
  }

  // ------------------------------------------------------------ code-drawn fallbacks

  drawPieces(scene) {
    this.make(scene, 'floorA', g => g.fillStyle(0x8e9194, 1).fillRect(0, 0, 128, 128));
    this.make(scene, 'floorB', g => g.fillStyle(0x888b8e, 1).fillRect(0, 0, 128, 128));

    for (let i = 0; i < 3; i++) {
      const vc = this.vehicleColors[i];
      const lc = this.liftColors[i];
      this.make(scene, 'crate' + i, g => {
        if (i === 1) g.fillStyle(vc, 1).fillRoundedRect(48, 14, 32, 100, 14);
        else g.fillStyle(vc, 1).fillRoundedRect(30, 10, 68, 108, 20);
        g.fillStyle(0x1e2c35, 1).fillRoundedRect(38, 34, 52, 16, 5);
        if (i > 0) {
          g.fillStyle(0xffffff, 1).fillCircle(64, 72, 15);
          TextureFactory.symbol(g, i === 1 ? 'circle' : 'triangle', 64, 72, vc, 1, 8);
        }
      });
      this.make(scene, 'hole' + i, g => {
        g.fillStyle(lc, 1).fillRect(4, 4, 120, 120);
        g.fillStyle(0x0b0c0d, 1).fillRect(16, 16, 96, 96);
        if (i > 0) TextureFactory.symbol(g, i === 1 ? 'circle' : 'triangle', 64, 64, lc, 1, 14);
      });
      this.make(scene, 'filled' + i, g => {
        g.fillStyle(lc, 1).fillRect(4, 4, 120, 120);
        g.fillStyle(0x8d9296, 1).fillRect(16, 16, 96, 96);
        g.fillStyle(0x43f07d, 1).fillCircle(108, 20, 6);
      });
    }

    this.make(scene, 'wall0', g => { g.fillStyle(0xf2c230, 1).fillRect(16, 16, 96, 96); g.fillStyle(0xb9bcbf, 1).fillRect(30, 30, 68, 68); });
    this.make(scene, 'wall1', g => g.fillStyle(0xff7a1a, 1).fillRoundedRect(10, 44, 108, 40, 12));
    this.make(scene, 'wall2', g => { g.fillStyle(0xa7abae, 1).fillRect(14, 14, 100, 100); g.fillStyle(0x3f8f3a, 1).fillCircle(64, 64, 38); });

    this.make(scene, 'select', g => g.lineStyle(10, 0xffd23f, 1).strokeRoundedRect(5, 5, 118, 118, 22));
  }

  // ------------------------------------------------------------ board + effects

  /** Yellow-and-black painted kerb around the parking floor. */
  drawBoardFrame(scene, rect) {
    const g = scene.add.graphics();
    const p = 16;
    const x = rect.x - p;
    const y = rect.y - p;
    const w = rect.w + p * 2;
    const h = rect.h + p * 2;
    g.fillStyle(0x000000, 0.35).fillRect(x + 6, y + 8, w, h);
    g.fillStyle(0x1d1d1d, 1).fillRect(x, y, w, h);
    g.fillStyle(0xf2c230, 1);
    const seg = 24;
    for (let i = 0; i * seg < w; i += 2) {
      const sw = Math.min(seg, w - i * seg);
      g.fillRect(x + i * seg, y, sw, p);
      g.fillRect(x + i * seg, y + h - p, sw, p);
    }
    for (let i = 0; i * seg < h; i += 2) {
      const sh = Math.min(seg, h - i * seg);
      g.fillRect(x, y + i * seg, p, sh);
      g.fillRect(x + w - p, y + i * seg, p, sh);
    }
    return g;
  }

  /** A green "PARKING FULL" sign drops in and blinks. */
  playWin(scene, rect, done) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    let sign;
    if (this.has(scene, 'fullsign')) {
      sign = scene.add.image(cx, rect.y - 80, this.key('fullsign')).setDepth(60);
      sign.setDisplaySize(Math.min(380, rect.w * 0.8), Math.min(380, rect.w * 0.8) * (sign.height / sign.width));
    } else {
      sign = scene.add.text(cx, rect.y - 80, 'PARKING FULL', {
        fontFamily: 'Courier New, monospace', fontSize: '40px', color: '#7dffa8', backgroundColor: '#141618',
        padding: { x: 18, y: 10 }
      }).setOrigin(0.5).setDepth(60);
    }
    scene.tweens.add({
      targets: sign,
      y: cy,
      duration: 420,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: sign, alpha: 0.35, duration: 150, yoyo: true, repeat: 2,
          onComplete: () => scene.time.delayedCall(250, () => { sign.destroy(); done(); })
        });
      }
    });
  }
}
