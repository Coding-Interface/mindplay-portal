/**
 * BootScene
 * Loads the level bank and the kitchen art, draws the star icons, then opens the menu.
 * URL options: ?class=3..8 skips the menu; &mode=adaptive for adaptive difficulty.
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const label = this.add.text(width / 2, height / 2 - 40, 'Loading…', { fontFamily: GameConfig.FONT, fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
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
    this.load.image('shelf', A + 'shelf.jpg');
    [3, 4].forEach(c => {
      this.load.image('jar' + c + '_back', A + 'jar' + c + '_back.png');
      this.load.image('jar' + c + '_front', A + 'jar' + c + '_front.png');
    });
    this.load.image('scoop_hidden', A + 'scoop_hidden.png');
    SpiceTable.LIST.forEach(s => this.load.image('scoop_' + s.key, A + 'scoop_' + s.key + '.png'));
  }

  create() {
    const bank = this.cache.json.get('levelBank');
    if (!bank || !bank.bands) return;
    BootScene.drawStar(this, 'star', GameConfig.COLORS.star, 0xd19c00);
    BootScene.drawStar(this, 'starEmpty', 0x7a6650, 0x4a3a2a);
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1).fillCircle(16, 16, 16);
    g.generateTexture('dot', 32, 32);
    g.destroy();

    const storage = new SafeStorage(GameConfig.STORAGE_PREFIX);
    this.registry.set('bank', bank);
    this.registry.set('storage', storage);
    this.registry.set('sound', new SoundFX(storage));

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
}
