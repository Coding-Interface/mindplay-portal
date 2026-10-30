/**
 * PotholeTheme — "Monsoon Pothole Patrol"
 * The monsoon has broken the road outside school. The child is on the repair
 * crew, rolling carts into potholes before the school bus arrives.
 * Art: assets/pothole/ (code-drawn fallbacks below are used if a file is missing).
 *
 *  crate  -> cart (rolls on the wet road and can't brake)
 *  hole   -> pothole (colour 1: road pothole for asphalt, colour 2: open drain for concrete)
 *  wall   -> roadblock (auto-rickshaw, barricade, tree)
 *  filled -> patched road
 */
class PotholeTheme extends BaseTheme {
  constructor() {
    super();
    this.id = 'pothole';
    this.name = 'Pothole Patrol';
    this.tagline = 'Monsoon broke the road! Fill every pothole before the school bus comes.';
    this.wallVariants = 3;
    this.extraAssets = [['bus', 'png']];
    this.movesLabel = 'Moves';
    this.words = {
      crate: 'cart', crates: 'carts', hole: 'pothole', holes: 'potholes', wall: 'roadblock', walls: 'roadblocks'
    };
    this.colorWords = {
      colorRule: 'New rule: orange asphalt carts (●) fix road potholes. Blue concrete carts (▲) fix drains.',
      colorPass: 'A cart rolls straight over a hole it cannot fix.'
    };
    this.colors = {
      bg: 0x3d5566,
      panel: 0x22313b,
      panelLine: 0xffd23f,
      tipBg: '#2c4250',
      tipWarn: '#b5482b',
      text: '#ffffff',
      textDim: '#d4e0e8',
      dotEmpty: 0x4a6070,
      btnDark: 0x4a6070,
      btnDarkShade: 0x2c3c47
    };
    this.summaryHeading = 'Road fixed! Great planning!';
    this.cartLoads = [
      { tray: 0x8a9299, trayDark: 0x5e666c, symbol: 'none' },
      { tray: 0xff8c42, trayDark: 0xc4581a, symbol: 'circle' },
      { tray: 0x4d9de0, trayDark: 0x2b6aa3, symbol: 'triangle' }
    ];
  }

  levelIntro(best) {
    return 'School bus is coming! Best crews fix the road in ' + best + ' moves.';
  }

  drawPieces(scene) {
    this.make(scene, 'floorA', g => this.asphalt(g, 0x4a4f55, 1));
    this.make(scene, 'floorB', g => this.asphalt(g, 0x464b51, 2));

    this.make(scene, 'wall0', g => this.autoRickshaw(g));
    this.make(scene, 'wall1', g => this.barricade(g));
    this.make(scene, 'wall2', g => this.tree(g));

    this.cartLoads.forEach((c, i) => this.make(scene, 'crate' + i, g => this.cart(g, c, i)));

    this.make(scene, 'hole0', g => this.pothole(g, 'p0'));
    this.make(scene, 'hole1', g => {
      this.pothole(g, 'p1');
      g.lineStyle(7, 0xff8c42, 1).strokeEllipse(64, 66, 118, 104);
      TextureFactory.symbol(g, 'circle', 64, 66, 0xff8c42, 0.95, 12);
    });
    this.make(scene, 'hole2', g => this.drain(g));

    this.make(scene, 'filled0', g => this.patch(g, 0x2a2d31, 0x3a3e43));
    this.make(scene, 'filled1', g => this.patch(g, 0x2a2d31, 0xff8c42));
    this.make(scene, 'filled2', g => this.slab(g));

    this.make(scene, 'select', g => {
      g.lineStyle(10, 0xe6ff3d, 1).strokeRoundedRect(5, 5, 118, 118, 26);
    });

    this.make(scene, 'rain', g => {
      g.fillStyle(0xcfe3ef, 1).fillRect(3, 0, 2, 30);
    }, 8, 32);

    this.make(scene, 'bus', g => this.bus(g), 256, 128);
  }

  // ------------------------------------------------------------ pieces

  asphalt(g, base, seed) {
    g.fillStyle(base, 1).fillRect(0, 0, 128, 128);
    const rng = new SeededRandom('asphalt' + seed);
    for (let i = 0; i < 70; i++) {
      g.fillStyle(rng.next() > 0.5 ? 0x5d636a : 0x3a3e43, 0.8);
      g.fillCircle(rng.between(2, 126), rng.between(2, 126), rng.between(1, 3));
    }
    g.lineStyle(2, 0x2f3338, 0.6).strokeRect(1, 1, 126, 126);
  }

  autoRickshaw(g) {
    g.fillStyle(0x000000, 0.25).fillEllipse(64, 112, 104, 18);
    g.fillStyle(0x1b1b1b, 1).fillRoundedRect(18, 88, 20, 26, 5).fillRoundedRect(90, 88, 20, 26, 5);
    g.fillStyle(0x2e9e4f, 1).fillPoints([{ x: 30, y: 58 }, { x: 98, y: 58 }, { x: 106, y: 100 }, { x: 22, y: 100 }], true);
    g.fillStyle(0x1f7a3b, 1).fillRect(24, 92, 80, 8);
    g.fillStyle(0xffcc00, 1).fillRoundedRect(20, 12, 88, 54, 20);
    g.fillStyle(0xe0a800, 1).fillRect(20, 56, 88, 8);
    g.fillStyle(0x9fd3e6, 1).fillRoundedRect(36, 28, 56, 26, 6);
    g.fillStyle(0xfff8c4, 1).fillCircle(64, 78, 8);
    g.fillStyle(0x1b1b1b, 1).fillRoundedRect(55, 98, 18, 22, 5);
  }

  barricade(g) {
    g.fillStyle(0x000000, 0.25).fillEllipse(64, 112, 100, 16);
    g.fillStyle(0x6d747a, 1).fillRect(24, 46, 10, 66).fillRect(94, 46, 10, 66);
    g.fillStyle(0xffffff, 1).fillRoundedRect(10, 40, 108, 36, 6);
    g.fillStyle(0xe63946, 1);
    for (let x = 4; x < 118; x += 26) {
      g.fillPoints([{ x: x + 6, y: 40 }, { x: x + 20, y: 40 }, { x: x + 6, y: 76 }, { x: x - 8, y: 76 }], true);
    }
    g.lineStyle(3, 0x9aa1a7, 1).strokeRoundedRect(10, 40, 108, 36, 6);
    g.fillStyle(0xff8c42, 1).fillCircle(64, 30, 8);
  }

  tree(g) {
    g.fillStyle(0x000000, 0.25).fillEllipse(68, 72, 108, 100);
    g.fillStyle(0x2f8f46, 1).fillCircle(48, 56, 32).fillCircle(80, 50, 30).fillCircle(64, 82, 34).fillCircle(88, 80, 22);
    g.fillStyle(0x49b35f, 1).fillCircle(44, 48, 14).fillCircle(78, 42, 12).fillCircle(60, 74, 13);
  }

  cart(g, c, i) {
    g.fillStyle(0x000000, 0.25).fillEllipse(64, 112, 100, 16);
    // load
    if (i === 0) {
      g.fillStyle(0xcdb27a, 1).fillRoundedRect(60, 18, 46, 40, 14);
      g.fillStyle(0xd8c08a, 1).fillRoundedRect(22, 22, 46, 38, 14);
      g.lineStyle(3, 0x9c8152, 1).lineBetween(45, 22, 45, 30).lineBetween(83, 18, 83, 26);
    } else if (i === 1) {
      g.fillStyle(0x1e1e1e, 1).fillEllipse(64, 50, 84, 44);
      g.fillStyle(0x3a3a3a, 1).fillEllipse(52, 42, 30, 12);
    } else {
      g.fillStyle(0x9aa5ad, 1).fillEllipse(64, 50, 84, 44);
      g.fillStyle(0xc4ccd2, 1).fillEllipse(52, 42, 30, 12);
    }
    // tray
    g.fillStyle(c.trayDark, 1).fillRoundedRect(12, 56, 104, 44, 12);
    g.fillStyle(c.tray, 1).fillRoundedRect(12, 52, 104, 40, 12);
    g.lineStyle(4, c.trayDark, 1).lineBetween(116, 60, 124, 46);
    // wheels
    g.fillStyle(0x1b1b1b, 1).fillCircle(34, 104, 12).fillCircle(94, 104, 12);
    g.fillStyle(0x8a9299, 1).fillCircle(34, 104, 5).fillCircle(94, 104, 5);
    TextureFactory.symbol(g, c.symbol, 64, 72, 0xffffff, 1, 12);
  }

  pothole(g, seed) {
    g.fillStyle(0x2b2e33, 1).fillPoints(TextureFactory.blob(64, 66, 58, 50, seed + 'a'), true);
    g.fillStyle(0x1b1c1f, 1).fillPoints(TextureFactory.blob(64, 66, 50, 42, seed), true);
    g.fillStyle(0x4f5f66, 1).fillPoints(TextureFactory.blob(64, 70, 36, 26, seed + 'w'), true);
    g.fillStyle(0xffffff, 0.3).fillEllipse(54, 64, 22, 5);
    g.lineStyle(3, 0x24262a, 1).lineBetween(8, 30, 20, 40).lineBetween(110, 104, 122, 118);
  }

  drain(g) {
    g.fillStyle(0x1b1c1f, 1).fillRoundedRect(16, 18, 96, 94, 10);
    g.fillStyle(0x23415e, 1).fillRoundedRect(28, 30, 72, 70, 8);
    g.fillStyle(0xffffff, 0.25).fillEllipse(54, 50, 26, 5);
    g.lineStyle(9, 0x4d9de0, 1).strokeRoundedRect(14, 16, 100, 98, 12);
    TextureFactory.symbol(g, 'triangle', 64, 68, 0x8cc4f2, 1, 12);
  }

  patch(g, fill, edge) {
    g.fillStyle(edge, 1).fillRoundedRect(10, 12, 108, 104, 12);
    g.fillStyle(fill, 1).fillRoundedRect(16, 18, 96, 92, 10);
    const rng = new SeededRandom('patch' + edge);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0x45494f, 0.8).fillCircle(rng.between(22, 106), rng.between(24, 104), rng.between(1, 2));
    }
  }

  slab(g) {
    g.fillStyle(0x4d9de0, 1).fillRoundedRect(14, 16, 100, 98, 12);
    g.fillStyle(0xa9b3ba, 1).fillRoundedRect(22, 24, 84, 82, 8);
    g.lineStyle(3, 0x87929a, 1);
    for (let x = 36; x <= 92; x += 14) g.lineBetween(x, 30, x, 100);
    TextureFactory.symbol(g, 'triangle', 64, 66, 0x2b6aa3, 0.9, 10);
  }

  bus(g) {
    g.fillStyle(0x000000, 0.25).fillEllipse(128, 114, 230, 16);
    g.fillStyle(0xffc93c, 1).fillRoundedRect(8, 18, 240, 82, 16);
    g.fillStyle(0xe0a800, 1).fillRect(8, 80, 240, 10);
    g.fillStyle(0x1b1b1b, 1).fillRect(8, 64, 240, 6);
    g.fillStyle(0x9fd3e6, 1);
    for (let x = 22; x < 190; x += 38) g.fillRoundedRect(x, 28, 30, 28, 4);
    g.fillRoundedRect(206, 28, 34, 34, 4);
    g.fillStyle(0xfff8c4, 1).fillCircle(240, 84, 6);
    g.fillStyle(0x1b1b1b, 1).fillCircle(56, 102, 16).fillCircle(196, 102, 16);
    g.fillStyle(0x8a9299, 1).fillCircle(56, 102, 7).fillCircle(196, 102, 7);
  }

  // ------------------------------------------------------------ board + effects

  /** Black-and-white painted kerb around the road. */
  drawBoardFrame(scene, rect) {
    const g = scene.add.graphics();
    const pad = 16;
    const x = rect.x - pad;
    const y = rect.y - pad;
    const w = rect.w + pad * 2;
    const h = rect.h + pad * 2;
    g.fillStyle(0x1b1b1b, 1).fillRect(x, y, w, h);
    g.fillStyle(0xf2f2f2, 1);
    const seg = 32;
    for (let i = 0; i * seg < w; i += 2) {
      const sw = Math.min(seg, w - i * seg);
      g.fillRect(x + i * seg, y, sw, pad);
      g.fillRect(x + i * seg, y + h - pad, sw, pad);
    }
    for (let i = 0; i * seg < h; i += 2) {
      const sh = Math.min(seg, h - i * seg);
      g.fillRect(x, y + i * seg, pad, sh);
      g.fillRect(x + w - pad, y + i * seg, pad, sh);
    }
    return g;
  }

  addAmbience(scene) {
    const W = scene.scale.width;
    const rain = scene.add.particles(0, -40, this.key('rain'), {
      x: { min: -100, max: W + 100 },
      speedY: { min: 650, max: 850 },
      speedX: { min: -120, max: -80 },
      lifespan: 1300,
      alpha: { start: 0.35, end: 0.1 },
      quantity: 2,
      frequency: 35
    });
    rain.setDepth(-1);
    return rain;
  }

  playWin(scene, rect, done) {
    const y = rect.y + rect.h / 2;
    const bus = scene.add.image(rect.x - 200, y, this.key('bus')).setDepth(60);
    const w = Math.min(rect.w * 0.75, 380);
    bus.setDisplaySize(w, w * (bus.height / bus.width));
    scene.tweens.add({
      targets: bus,
      x: rect.x + rect.w + 200,
      duration: 1300,
      ease: 'Sine.easeInOut',
      onComplete: () => { bus.destroy(); done(); }
    });
    scene.tweens.add({ targets: bus, y: y - 3, duration: 120, yoyo: true, repeat: 5 });
  }
}
