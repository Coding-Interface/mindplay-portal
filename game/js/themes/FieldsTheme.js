/**
 * FieldsTheme — "Water the Fields"
 * The monsoon is late. Water let into a channel flows straight until a bund,
 * haystack or tree stops it, or until it reaches the first dry field that
 * needs it, which it fills. A watered field can be crossed by later water,
 * just like a filled hole becomes floor.
 *
 *  crate  -> pool of water (plain, canal water ●, well water ▲)
 *  hole   -> dry field (any crop, paddy ●, vegetables ▲)
 *  wall   -> earth bund, haystack, mango tree
 *  filled -> watered field, sprouting
 * Art: assets/fields/ (code-drawn fallbacks below are used if a file is missing).
 */
class FieldsTheme extends BaseTheme {
  constructor() {
    super();
    this.id = 'fields';
    this.name = 'Water the Fields';
    this.tagline = 'The monsoon is late! Send water along the channels to every dry field.';
    this.wallVariants = 3;
    this.movesLabel = 'Flows';
    this.words = {
      crate: 'pool', crates: 'pools', hole: 'dry field', holes: 'dry fields', wall: 'obstacle', walls: 'obstacles'
    };
    this.colorWords = {
      colorRule: 'New rule: canal water (●) is for paddy fields, well water (▲) is for vegetable fields.',
      colorPass: 'Water flows straight past a field that needs the other kind.'
    };
    this.colors = {
      bg: 0x6b8f3c,
      panel: 0x2d4a1f,
      panelLine: 0xffd23f,
      tipBg: '#3b5a28',
      tipWarn: '#a8321f',
      text: '#ffffff',
      textDim: '#e6f2d2',
      dotEmpty: 0x557a33,
      btnDark: 0x557a33,
      btnDarkShade: 0x36521f
    };
    this.summaryHeading = 'Every field watered! Great planning!';
    this.water = [0x4aa3df, 0x2fa596, 0x3d8ee0];
  }

  levelIntro(best) {
    return 'The monsoon is late! Water every dry field in ' + best + ' flows.';
  }

  // ------------------------------------------------------------ code-drawn fallbacks

  drawPieces(scene) {
    this.make(scene, 'floorA', g => g.fillStyle(0x8a6440, 1).fillRect(0, 0, 128, 128));
    this.make(scene, 'floorB', g => g.fillStyle(0x84603d, 1).fillRect(0, 0, 128, 128));

    this.water.forEach((c, i) => {
      this.make(scene, 'crate' + i, g => {
        g.fillStyle(0x6b4a2c, 1).fillCircle(64, 66, 52);
        g.fillStyle(c, 1).fillCircle(64, 66, 42);
        g.fillStyle(0xffffff, 0.4).fillEllipse(50, 52, 30, 10);
        if (i > 0) {
          g.fillStyle(0xffffff, 1).fillCircle(64, 66, 16);
          TextureFactory.symbol(g, i === 1 ? 'circle' : 'triangle', 64, 66, c, 1, 9);
        }
      });
      this.make(scene, 'hole' + i, g => {
        g.fillStyle(0x9b7046, 1).fillRoundedRect(6, 6, 116, 116, 10);
        g.fillStyle(0xc99d6b, 1).fillRoundedRect(16, 16, 96, 96, 6);
        g.lineStyle(2, 0x5e4022, 0.8).lineBetween(30, 40, 60, 70).lineBetween(60, 70, 90, 50).lineBetween(60, 70, 70, 100);
        if (i > 0) TextureFactory.symbol(g, i === 1 ? 'circle' : 'triangle', 96, 96, c, 1, 10);
      });
      this.make(scene, 'filled' + i, g => {
        g.fillStyle(0x9b7046, 1).fillRoundedRect(6, 6, 116, 116, 10);
        g.fillStyle(i === 2 ? 0x5a3e24 : 0x5f9a86, 1).fillRoundedRect(16, 16, 96, 96, 6);
        g.fillStyle(0x6fbf55, 1);
        for (let y = 30; y < 110; y += 20) for (let x = 30; x < 110; x += 20) g.fillCircle(x, y, 5);
      });
    });

    this.make(scene, 'wall0', g => g.fillStyle(0x7a5636, 1).fillEllipse(64, 64, 110, 76));
    this.make(scene, 'wall1', g => { g.fillStyle(0xcfa246, 1).fillCircle(64, 64, 50); g.fillStyle(0x8a6420, 1).fillCircle(64, 64, 8); });
    this.make(scene, 'wall2', g => { g.fillStyle(0x2f7a2c, 1).fillCircle(64, 64, 52); g.fillStyle(0xf2b632, 1).fillCircle(50, 50, 6).fillCircle(80, 70, 6); });

    this.make(scene, 'select', g => g.lineStyle(10, 0xffd23f, 1).strokeCircle(64, 64, 58));
    this.make(scene, 'pollen', g => g.fillStyle(0xfff3a0, 1).fillCircle(64, 64, 64));
    this.make(scene, 'bird', g => {
      g.lineStyle(9, 0x2b2b2b, 1);
      g.beginPath(); g.moveTo(8, 30); g.lineTo(32, 46); g.lineTo(56, 30); g.strokePath();
    }, 64, 64);
    this.make(scene, 'wet', g => g.fillStyle(0x4aa3df, 1).fillRoundedRect(8, 8, 112, 112, 28));
  }

  // ------------------------------------------------------------ board + effects

  /** Raised earth bund around the farm. */
  drawBoardFrame(scene, rect) {
    const g = scene.add.graphics();
    const p = 18;
    g.fillStyle(0x000000, 0.25).fillRoundedRect(rect.x - p + 6, rect.y - p + 8, rect.w + p * 2, rect.h + p * 2, 18);
    g.fillStyle(0x6e4c2c, 1).fillRoundedRect(rect.x - p, rect.y - p, rect.w + p * 2, rect.h + p * 2, 18);
    g.fillStyle(0x9b7046, 1).fillRoundedRect(rect.x - p + 3, rect.y - p + 3, rect.w + p * 2 - 6, rect.h + p * 2 - 6, 16);
    g.fillStyle(0x6e4c2c, 1).fillRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
    const rng = new SeededRandom('bund-grass');
    g.lineStyle(3, 0x6f9a3a, 1);
    for (let i = 0; i < 60; i++) {
      const side = i % 4;
      const t = rng.next();
      let x;
      let y;
      if (side === 0) { x = rect.x - p + t * (rect.w + p * 2); y = rect.y - p + 6; }
      else if (side === 1) { x = rect.x - p + t * (rect.w + p * 2); y = rect.y + rect.h + p - 8; }
      else if (side === 2) { x = rect.x - p + 7; y = rect.y - p + t * (rect.h + p * 2); }
      else { x = rect.x + rect.w + p - 8; y = rect.y - p + t * (rect.h + p * 2); }
      g.lineBetween(x, y, x - 3, y - 8).lineBetween(x, y, x + 3, y - 8);
    }
    return g;
  }

  /** Water leaves a wet trail along the channel it flowed through. */
  onSlide(scene, points, cell) {
    const tint = 0x6fb7e6;
    points.forEach((p, i) => {
      const w = scene.add.image(p.x, p.y, this.key('wet')).setDisplaySize(cell * 0.86, cell * 0.86)
        .setTint(tint).setAlpha(0).setDepth(15);
      scene.tweens.add({
        targets: w,
        alpha: { from: 0.45, to: 0 },
        delay: i * 60,
        duration: 1100,
        onComplete: () => w.destroy()
      });
    });
  }

  addAmbience(scene) {
    const W = scene.scale.width;
    const H = scene.scale.height;
    const pollen = scene.add.particles(0, 0, this.key('pollen'), {
      x: { min: 0, max: W },
      y: { min: 0, max: H },
      speedX: { min: 6, max: 20 },
      speedY: { min: -10, max: 6 },
      scale: { min: 0.02, max: 0.045 },
      alpha: { start: 0.55, end: 0 },
      lifespan: 4500,
      frequency: 220
    });
    pollen.setDepth(-1);
    return pollen;
  }

  /** A flock of birds flies over the green fields. */
  playWin(scene, rect, done) {
    const n = 5;
    let finished = 0;
    for (let i = 0; i < n; i++) {
      const y = rect.y + rect.h * (0.25 + (i % 3) * 0.2);
      const b = scene.add.image(rect.x - 80 - i * 50, y, this.key('bird')).setDisplaySize(44, 44).setDepth(60);
      scene.tweens.add({ targets: b, scaleY: b.scaleY * 0.5, duration: 160, yoyo: true, repeat: -1 });
      scene.tweens.add({
        targets: b,
        x: rect.x + rect.w + 120,
        y: y - 40,
        duration: 1300,
        delay: i * 60,
        ease: 'Sine.easeIn',
        onComplete: () => {
          b.destroy();
          finished++;
          if (finished === n) done();
        }
      });
    }
  }
}
