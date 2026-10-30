/**
 * BaseTheme
 * A theme is the real-life story wrapped around the same puzzle rules:
 * its pieces' names, colours, art, board frame, ambience and win moment.
 *
 * Art comes from image files in assets/<theme id>/ (made by
 * tools/assets/build-assets.js, or your own art with the same names).
 * If an image is missing, the theme draws a simple version in code instead.
 *
 * Texture keys are prefixed with the theme id (see key()), so every theme's
 * textures can live side by side and the player can switch on the menu.
 *
 * Subclasses override:
 *   id, name, tagline, words, colorWords, colors, wallVariants, extraAssets
 *   drawPieces(scene)            code-drawn fallbacks: floorA, floorB, wall0..n, crate0..2, hole0..2, filled0..2, select
 *   drawBoardFrame(scene, rect)  returns a Graphics drawn behind the board
 *   drawBoardDecor(scene, rect)  optional, drawn on top of the ground (returns object or null)
 *   addAmbience(scene)           optional background effect (returns object or null)
 *   onSlide(scene, points, cell) optional effect along a move's path (e.g. a water trail)
 *   levelIntro(best)             banner text at level start
 *   playWin(scene, rect, done)   short celebration, then done()
 */
class BaseTheme {
  constructor() {
    this.id = 'base';
    this.name = 'Fill the Holes';
    this.tagline = '';
    this.wallVariants = 1;
    this.movesLabel = 'Moves';
    this.extraAssets = [];
    this.words = {
      crate: 'crate', crates: 'crates', hole: 'hole', holes: 'holes', wall: 'wall', walls: 'walls'
    };
    this.colorWords = {
      colorRule: 'New rule: a {crate} only drops into a {hole} of its own colour.',
      colorPass: '{Crates} slide over {holes} of a different colour.'
    };
    this.colors = {
      bg: 0x1f6f78,
      panel: 0x0f3d42,
      panelLine: 0xffd23f,
      tipBg: '#16545b',
      tipWarn: '#b5482b',
      text: '#ffffff',
      textDim: '#cfe8ea',
      dotEmpty: 0x2f5e63,
      btnDark: 0x2f5e63,
      btnDarkShade: 0x1b3e42
    };
    this.summaryHeading = 'Great thinking!';
  }

  /** Texture key for this theme. */
  key(name) {
    return this.id + '-' + name;
  }

  has(scene, name) {
    return scene.textures.exists(this.key(name));
  }

  /** Image files this theme loads: [{ name, url }]. */
  assetList() {
    const names = [['ground', 'jpg'], ['bg', 'jpg']];
    for (let i = 0; i < 3; i++) {
      names.push(['crate' + i, 'png'], ['hole' + i, 'png'], ['filled' + i, 'png']);
    }
    for (let i = 0; i < this.wallVariants; i++) names.push(['wall' + i, 'png']);
    this.extraAssets.forEach(n => names.push(n));
    return names.map(([name, ext]) => ({ name, url: GameConfig.ASSET_PATH + this.id + '/' + name + '.' + ext }));
  }

  /** Queue this theme's images on a scene's loader (call in preload). */
  loadAssets(scene) {
    this.assetList().forEach(a => scene.load.image(this.key(a.name), a.url));
  }

  /** Code-drawn fallbacks for anything the image files did not provide. */
  buildTextures(scene) {
    this.drawPieces(scene);
  }

  make(scene, name, draw, w, h) {
    TextureFactory.make(scene, this.key(name), draw, w, h);
  }

  wallKey(cellIndex) {
    return this.key('wall' + (cellIndex % this.wallVariants));
  }

  /**
   * Full-screen background picture (if the theme has one), with an optional
   * dark veil so text on top stays readable.
   */
  addBackground(scene, veil) {
    const W = scene.scale.width;
    const H = scene.scale.height;
    scene.cameras.main.setBackgroundColor(this.colors.bg);
    if (!this.has(scene, 'bg')) return null;
    const img = scene.add.image(W / 2, H / 2, this.key('bg')).setDisplaySize(W, H).setDepth(-3);
    if (veil) scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, veil).setDepth(-2);
    return img;
  }

  /**
   * The board's ground: one continuous texture (if the theme has 'ground')
   * with a faint grid so children can count cells; otherwise checker tiles.
   * Returns the created objects; the first one is interactive.
   */
  drawGround(scene, rect, cell, cols, rows) {
    const out = [];
    if (this.has(scene, 'ground')) {
      const ground = scene.add.tileSprite(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h, this.key('ground'));
      ground.setTileScale((cell * 3) / 512);
      out.push(ground);
      const grid = scene.add.graphics();
      grid.lineStyle(2, 0x000000, 0.16);
      for (let c = 1; c < cols; c++) grid.lineBetween(rect.x + c * cell, rect.y, rect.x + c * cell, rect.y + rect.h);
      for (let r = 1; r < rows; r++) grid.lineBetween(rect.x, rect.y + r * cell, rect.x + rect.w, rect.y + r * cell);
      grid.lineStyle(1, 0xffffff, 0.07);
      for (let c = 1; c < cols; c++) grid.lineBetween(rect.x + c * cell + 1, rect.y, rect.x + c * cell + 1, rect.y + rect.h);
      for (let r = 1; r < rows; r++) grid.lineBetween(rect.x, rect.y + r * cell + 1, rect.x + rect.w, rect.y + r * cell + 1);
      out.push(grid);
      return out;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = (r + c) % 2 === 0 ? 'floorA' : 'floorB';
        out.push(scene.add.image(rect.x + (c + 0.5) * cell, rect.y + (r + 0.5) * cell, this.key(key)).setDisplaySize(cell, cell));
      }
    }
    return out;
  }

  /** Fill {crate}, {Holes}, {colorRule}… in a sentence. */
  say(template) {
    let s = template;
    Object.keys(this.colorWords).forEach(k => { s = s.split('{' + k + '}').join(this.colorWords[k]); });
    Object.keys(this.words).forEach(k => {
      const w = this.words[k];
      s = s.split('{' + k + '}').join(w);
      const cap = k.charAt(0).toUpperCase() + k.slice(1);
      s = s.split('{' + cap + '}').join(w.charAt(0).toUpperCase() + w.slice(1));
    });
    return s;
  }

  darkButton(extra) {
    return Object.assign({ fill: this.colors.btnDark, shade: this.colors.btnDarkShade, color: '#ffffff' }, extra || {});
  }

  levelIntro(best) {
    return 'Fill every ' + this.words.hole + ' in ' + best + ' moves.';
  }

  drawPieces(scene) { /* override */ }

  drawBoardFrame(scene, rect) {
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(rect.x - 14, rect.y - 14, rect.w + 28, rect.h + 28, 22);
    return g;
  }

  drawBoardDecor(scene, rect) { return null; }

  addAmbience(scene) { return null; }

  /** Optional effect while a piece moves; points = cells it passes through. */
  onSlide(scene, points, cell) { /* override */ }

  playWin(scene, rect, done) {
    scene.time.delayedCall(500, done);
  }
}
