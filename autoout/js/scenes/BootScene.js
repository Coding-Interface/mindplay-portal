/**
 * BootScene
 * Loads the level bank, the street art and the sound effects, draws the star
 * icons and the exhaust puff, then opens the menu.
 * URL options: ?class=3..8 skips the menu; &mode=adaptive for adaptive difficulty.
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const label = this.add.text(width / 2, height / 2 - 40, 'Loading the morning rush…', { fontFamily: GameConfig.FONT, fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    this.load.on('progress', p => {
      bar.clear().fillStyle(0x000000, 0.35).fillRoundedRect(width / 2 - 200, height / 2, 400, 24, 12);
      bar.fillStyle(GameConfig.COLORS.accent, 1).fillRoundedRect(width / 2 - 200, height / 2, 400 * p, 24, 12);
    });
    this.load.on('loaderror', file => {
      if (file.key === 'levelBank') label.setText('Could not load levels. Please serve this folder over http.');
    });
    const A = GameConfig.ASSET_PATH;
    this.load.json('levelBank', GameConfig.LEVEL_BANK_URL);
    this.load.image('bg', A + 'bg.jpg');
    this.load.image('road', A + 'road.jpg');
    BootScene.IMAGES.forEach(k => this.load.image(k, A + k + '.png'));
    BootScene.KINDS.forEach(k => this.load.image(k, A + k + '.png'));
    SoundFX.KEYS.forEach(k => this.load.audio(k, GameConfig.SFX_PATH + k + '.mp3'));
  }

  create() {
    const bank = this.cache.json.get('levelBank');
    if (!bank || !bank.bands) return;
    BootScene.drawStar(this, 'star', GameConfig.COLORS.star, 0xd19c00);
    BootScene.drawStar(this, 'starEmpty', 0x55606a, 0x2f363c);
    BootScene.drawPuff(this);

    const storage = new SafeStorage(GameConfig.STORAGE_PREFIX);
    this.registry.set('bank', bank);
    this.registry.set('storage', storage);
    this.registry.set('sfx', new SoundFX(storage, this.sound));

    const params = new URLSearchParams(window.location.search);
    const cls = parseInt(params.get('class'), 10);
    const mode = params.get('mode') === 'adaptive' ? 'adaptive' : storage.get('mode', 'fixed');
    if (cls >= 3 && cls <= 8) this.scene.start('GameScene', { classLevel: cls, mode });
    else this.scene.start('MenuScene');
  }

  static drawStar(scene, key, fill, edge) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 58 : 26;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push({ x: 64 + Math.cos(a) * r, y: 66 + Math.sin(a) * r });
    }
    g.fillStyle(edge, 1).fillPoints(pts.map(p => ({ x: p.x, y: p.y + 4 })), true);
    g.fillStyle(fill, 1).fillPoints(pts, true);
    g.generateTexture(key, 128, 128);
    g.destroy();
  }

  /** Soft grey exhaust puff. */
  static drawPuff(scene) {
    if (scene.textures.exists('puff')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    for (let r = 16; r > 0; r -= 2) {
      g.fillStyle(0xd8d8d8, 0.08 + (16 - r) * 0.012);
      g.fillCircle(16, 16, r);
    }
    g.generateTexture('puff', 32, 32);
    g.destroy();
  }
}

/** Vehicles and blockers (one PNG each in assets/). */
BootScene.KINDS = ['van', 'auto', 'car', 'hatch', 'sedan', 'taxi', 'tempo', 'bus', 'truck', 'tanker', 'cow', 'barricade', 'cart'];
/** Scene pieces placed by the game. */
BootScene.IMAGES = ['curb', 'pillar', 'gateleaf', 'cop'];
