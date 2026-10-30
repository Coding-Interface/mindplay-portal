/**
 * TextureFactory
 * Draws textures with Phaser Graphics at boot, so the project ships with no
 * image files. Theme-independent textures (arrow, stars, spark) are built
 * here; each theme draws its own board pieces through make().
 * Pieces are drawn on a 128px canvas and scaled to the cell size.
 */
class TextureFactory {
  static buildShared(scene) {
    const C = GameConfig.COLORS;

    // arrow (points up; rotated for other directions)
    TextureFactory.make(scene, 'arrow', g => {
      g.fillStyle(C.arrowDark, 1);
      g.fillCircle(64, 68, 54);
      g.fillStyle(C.arrow, 1);
      g.fillCircle(64, 62, 54);
      g.fillStyle(0x1d2a33, 1);
      g.fillTriangle(64, 22, 28, 70, 100, 70);
      g.fillRect(50, 66, 28, 30);
    });

    TextureFactory.make(scene, 'star', g => TextureFactory.star(g, C.star, 0xd19c00));
    TextureFactory.make(scene, 'starEmpty', g => TextureFactory.star(g, 0x55606a, 0x2f363c));

    TextureFactory.make(scene, 'spark', g => {
      g.fillStyle(0xffffff, 1).fillCircle(64, 64, 40);
    });
  }

  /**
   * Draw into a new texture.
   * @param {Phaser.Scene} scene
   * @param {string} key
   * @param {function(Phaser.GameObjects.Graphics)} draw
   * @param {number} [w]  width  (default 128)
   * @param {number} [h]  height (default 128)
   */
  static make(scene, key, draw, w, h) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w || TextureFactory.SIZE, h || TextureFactory.SIZE);
    g.destroy();
  }

  /** Colour-blind helper: ● for colour 1, ▲ for colour 2. */
  static symbol(g, symbol, x, y, color, alpha, size) {
    const s = size || 16;
    g.fillStyle(color, alpha);
    if (symbol === 'circle') g.fillCircle(x, y, s);
    if (symbol === 'triangle') g.fillTriangle(x, y - s * 1.1, x - s * 1.1, y + s * 0.9, x + s * 1.1, y + s * 0.9);
  }

  /** Irregular blob around (cx, cy); deterministic for a given seed. */
  static blob(cx, cy, rx, ry, seed, points) {
    const n = points || 14;
    const rng = new SeededRandom(seed);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 0.78 + rng.next() * 0.3;
      pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k });
    }
    return pts;
  }

  static star(g, fill, edge) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 58 : 26;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push({ x: 64 + Math.cos(a) * r, y: 66 + Math.sin(a) * r });
    }
    g.fillStyle(edge, 1);
    g.fillPoints(pts.map(p => ({ x: p.x, y: p.y + 4 })), true);
    g.fillStyle(fill, 1);
    g.fillPoints(pts, true);
  }
}

TextureFactory.SIZE = 128;
