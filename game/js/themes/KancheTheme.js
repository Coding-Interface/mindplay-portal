/**
 * KancheTheme — "Kanche Champ"
 * The street marble game played on a patch of mud. Flick a marble (kancha):
 * it rolls straight until it hits a stone, a brick, a slipper, another marble
 * or the brick border, and drops into the first empty hole it rolls over.
 * Art: assets/kanche/ (code-drawn fallbacks below are used if a file is missing).
 *
 *  crate  -> marble (colour 0 green glass, 1 orange swirl ●, 2 blue swirl ▲)
 *  hole   -> small hole dug in the mud (colour holes are marked with chalk)
 *  wall   -> stopper: stone, brick or slipper
 *  filled -> marble sitting in the hole
 */
class KancheTheme extends BaseTheme {
  constructor() {
    super();
    this.id = 'kanche';
    this.name = 'Kanche Champ';
    this.tagline = 'Flick a marble. It rolls till it hits something. Get every hole filled!';
    this.wallVariants = 3;
    this.movesLabel = 'Flicks';
    this.words = {
      crate: 'marble', crates: 'marbles', hole: 'hole', holes: 'holes', wall: 'stopper', walls: 'stoppers'
    };
    this.colorWords = {
      colorRule: 'New rule: orange marbles (●) drop only into orange-chalk holes, blue marbles (▲) into blue-chalk holes.',
      colorPass: 'A marble rolls straight over a hole with the other chalk colour.'
    };
    this.colors = {
      bg: 0x5b7f4a,
      panel: 0x2f4a27,
      panelLine: 0xffd23f,
      tipBg: '#3d5e33',
      tipWarn: '#a8321f',
      text: '#ffffff',
      textDim: '#e3f0d6',
      dotEmpty: 0x4f7a3f,
      btnDark: 0x4f7a3f,
      btnDarkShade: 0x34552a
    };
    this.summaryHeading = 'Kanche champion! Great planning!';
    this.marbles = [
      { glass: 0x7fc8a9, edge: 0x3f8f6e, swirl: 0x2e7d5b, symbol: 'none' },
      { glass: 0xffc58f, edge: 0xc4581a, swirl: 0xff7a1a, symbol: 'circle' },
      { glass: 0x9cc9f2, edge: 0x2b6aa3, swirl: 0x1f5fbf, symbol: 'triangle' }
    ];
    this.chalk = [null, 0xff9a4d, 0x6fb4f0];
  }

  levelIntro(best) {
    return 'Your turn! Champions fill every hole in ' + best + ' flicks.';
  }

  drawPieces(scene) {
    this.make(scene, 'floorA', g => this.mud(g, 0xb98a5c, 1));
    this.make(scene, 'floorB', g => this.mud(g, 0xb4845a, 2));

    this.make(scene, 'wall0', g => this.stone(g));
    this.make(scene, 'wall1', g => this.brick(g));
    this.make(scene, 'wall2', g => this.slipper(g));

    this.marbles.forEach((m, i) => {
      this.make(scene, 'crate' + i, g => this.marble(g, m, 64, 64, 38, true));
      this.make(scene, 'filled' + i, g => {
        this.hole(g, null, 'f' + i);
        this.marble(g, m, 64, 66, 26, false);
      });
    });

    this.make(scene, 'hole0', g => this.hole(g, null, 'h0'));
    this.make(scene, 'hole1', g => {
      this.hole(g, null, 'h1');
      this.chalkRing(g, this.chalk[1], 'circle');
    });
    this.make(scene, 'hole2', g => {
      this.hole(g, null, 'h2');
      this.chalkRing(g, this.chalk[2], 'triangle');
    });

    this.make(scene, 'select', g => {
      g.lineStyle(10, 0xffd23f, 1).strokeCircle(64, 64, 56);
    });

    this.make(scene, 'dust', g => {
      g.fillStyle(0xfff2d6, 1).fillCircle(64, 64, 64);
    });
  }

  // ------------------------------------------------------------ pieces

  mud(g, base, seed) {
    g.fillStyle(base, 1).fillRect(0, 0, 128, 128);
    const rng = new SeededRandom('mud' + seed);
    for (let i = 0; i < 40; i++) {
      g.fillStyle(rng.next() > 0.5 ? 0xa37650 : 0xc89a6b, 0.7);
      g.fillCircle(rng.between(3, 125), rng.between(3, 125), rng.between(1, 3));
    }
    for (let i = 0; i < 4; i++) {
      g.fillStyle(0x8f8a82, 0.9).fillEllipse(rng.between(10, 118), rng.between(10, 118), rng.between(5, 8), rng.between(4, 6));
    }
    g.lineStyle(2, 0x9c7048, 0.35).strokeRect(1, 1, 126, 126);
  }

  stone(g) {
    g.fillStyle(0x000000, 0.25).fillPoints(TextureFactory.blob(70, 74, 48, 40, 'st-s'), true);
    g.fillStyle(0x7d7f82, 1).fillPoints(TextureFactory.blob(64, 66, 48, 40, 'st'), true);
    g.fillStyle(0x9a9ca0, 1).fillPoints(TextureFactory.blob(56, 56, 28, 20, 'st-h'), true);
    g.fillStyle(0xb9bbbe, 0.8).fillEllipse(48, 48, 16, 7);
  }

  brick(g) {
    g.fillStyle(0x000000, 0.25).fillRoundedRect(18, 34, 100, 66, 6);
    g.fillStyle(0x8e3b22, 1).fillRoundedRect(12, 30, 104, 66, 6);
    g.fillStyle(0xb5532f, 1).fillRoundedRect(12, 26, 104, 60, 6);
    g.fillStyle(0x9c4527, 1).fillRoundedRect(30, 42, 68, 28, 4);
    g.fillStyle(0xc7673f, 0.7).fillRect(18, 30, 40, 5);
  }

  slipper(g) {
    g.fillStyle(0x000000, 0.25).fillEllipse(68, 70, 60, 108);
    g.fillStyle(0x2b6aa3, 1).fillEllipse(64, 64, 58, 108);
    g.fillStyle(0xf2f2f2, 1).fillEllipse(64, 66, 46, 96);
    g.lineStyle(7, 0x2b6aa3, 1);
    g.lineBetween(64, 30, 44, 56).lineBetween(64, 30, 84, 56);
    g.fillStyle(0x2b6aa3, 1).fillCircle(64, 30, 5);
  }

  marble(g, m, x, y, r, shadow) {
    if (shadow) g.fillStyle(0x000000, 0.28).fillEllipse(x + 6, y + r * 0.85, r * 1.7, r * 0.55);
    g.fillStyle(m.edge, 1).fillCircle(x, y, r);
    g.fillStyle(m.glass, 1).fillCircle(x - r * 0.06, y - r * 0.06, r * 0.9);
    // swirl: two curved petals
    g.fillStyle(m.swirl, 0.85);
    g.fillPoints([
      { x: x - r * 0.7, y: y + r * 0.1 }, { x: x - r * 0.2, y: y - r * 0.35 }, { x: x + r * 0.3, y: y - r * 0.2 },
      { x: x - r * 0.05, y: y + r * 0.05 }, { x: x - r * 0.45, y: y + r * 0.35 }
    ], true);
    g.fillPoints([
      { x: x + r * 0.7, y: y - r * 0.05 }, { x: x + r * 0.25, y: y + r * 0.4 }, { x: x - r * 0.3, y: y + r * 0.3 },
      { x: x + r * 0.05, y: y + r * 0.05 }, { x: x + r * 0.45, y: y - r * 0.3 }
    ], true);
    if (m.symbol !== 'none') TextureFactory.symbol(g, m.symbol, x, y, 0xffffff, 1, r * 0.26);
    g.fillStyle(0xffffff, 0.85).fillEllipse(x - r * 0.38, y - r * 0.42, r * 0.5, r * 0.26);
  }

  hole(g, unused, seed) {
    g.fillStyle(0x8c6440, 1).fillPoints(TextureFactory.blob(64, 66, 44, 40, seed + 'rim'), true);
    g.fillStyle(0x3b2616, 1).fillCircle(64, 66, 30);
    g.fillStyle(0x24170d, 1).fillCircle(64, 70, 22);
  }

  chalkRing(g, color, symbol) {
    g.lineStyle(6, color, 0.95);
    if (symbol === 'circle') {
      g.strokeCircle(64, 66, 54);
    } else {
      g.strokeTriangle(64, 4, 6, 118, 122, 118);
    }
  }

  // ------------------------------------------------------------ board + effects

  /** Low brick border around the mud patch. */
  drawBoardFrame(scene, rect) {
    const g = scene.add.graphics();
    const pad = 18;
    const x = rect.x - pad;
    const y = rect.y - pad;
    const w = rect.w + pad * 2;
    const h = rect.h + pad * 2;
    g.fillStyle(0x000000, 0.25).fillRect(x + 6, y + 8, w, h);
    g.fillStyle(0x7a3420, 1).fillRect(x, y, w, h);
    g.fillStyle(0xb5532f, 1);
    const bw = 34;
    const gap = 3;
    const row = (yy, offset) => {
      for (let bx = x + offset; bx < x + w; bx += bw + gap) {
        g.fillRect(Math.max(x, bx), yy, Math.min(bw, x + w - bx), pad - gap);
      }
    };
    row(y + 1, 0);
    row(y + h - pad + 2, bw / 2);
    for (let by = y + pad; by < y + h - pad; by += bw + gap) {
      const bh = Math.min(bw, y + h - pad - by);
      g.fillRect(x + 1, by, pad - gap, bh);
      g.fillRect(x + w - pad + 2, by, pad - gap, bh);
    }
    return g;
  }

  /** Slow warm dust in the afternoon light. */
  addAmbience(scene) {
    const W = scene.scale.width;
    const H = scene.scale.height;
    const dust = scene.add.particles(0, 0, this.key('dust'), {
      x: { min: 0, max: W },
      y: { min: 0, max: H },
      speedX: { min: -8, max: 12 },
      speedY: { min: -14, max: -4 },
      scale: { min: 0.02, max: 0.05 },
      alpha: { start: 0.35, end: 0 },
      lifespan: 5000,
      frequency: 180,
      quantity: 1
    });
    dust.setDepth(-1);
    return dust;
  }

  /** A few marbles bounce up from the board. */
  playWin(scene, rect, done) {
    const n = 6;
    const size = Math.min(56, rect.w / 8);
    let finished = 0;
    for (let i = 0; i < n; i++) {
      const x = rect.x + rect.w * ((i + 0.5) / n);
      const m = scene.add.image(x, rect.y + rect.h - size, this.key('crate' + (i % 3)))
        .setDisplaySize(size, size).setDepth(60);
      scene.tweens.add({
        targets: m,
        y: rect.y + rect.h * 0.25,
        duration: 380,
        delay: i * 70,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          m.destroy();
          finished++;
          if (finished === n) done();
        }
      });
    }
  }
}
