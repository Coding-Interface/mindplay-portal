/**
 * BootScene
 * Loads the level bank and every theme's art, draws code fallbacks for any
 * missing art, then opens the menu.
 * URL options (for platform integration):
 *   ?class=3..8               skip the menu and start for that class
 *   ?mode=adaptive            adaptive difficulty (default: fixed)
 *   ?theme=pothole|kanche|fields|parking   theme (also #<id>)
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const label = this.add.text(width / 2, height / 2 - 40, 'Loading…', {
      fontFamily: GameConfig.FONT, fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5);
    this.load.on('progress', p => {
      bar.clear().fillStyle(0x000000, 0.35).fillRoundedRect(width / 2 - 200, height / 2, 400, 24, 12);
      bar.fillStyle(GameConfig.COLORS.arrow, 1).fillRoundedRect(width / 2 - 200, height / 2, 400 * p, 24, 12);
    });
    this.load.on('loaderror', file => {
      if (file.key === 'levelBank') label.setText('Could not load levels. Please serve this folder over http.');
      else console.warn('Missing art, using the drawn version instead:', file.src);
    });
    this.load.json('levelBank', GameConfig.LEVEL_BANK_URL);
    ThemeRegistry.all().forEach(t => t.loadAssets(this));
  }

  create() {
    const bank = this.cache.json.get('levelBank');
    if (!bank || !bank.bands) return;
    TextureFactory.buildShared(this);
    ThemeRegistry.buildAll(this);

    const storage = new SafeStorage(GameConfig.STORAGE_PREFIX);
    this.registry.set('bank', bank);
    this.registry.set('storage', storage);
    this.registry.set('sound', new SoundFX(storage));

    const themeId = ThemeRegistry.fromUrl() || storage.get('theme', 'pothole');
    ThemeRegistry.use(themeId);
    storage.set('theme', ThemeRegistry.current.id);

    const params = new URLSearchParams(window.location.search);
    const cls = parseInt(params.get('class'), 10);
    const mode = params.get('mode') === 'adaptive' ? 'adaptive' : storage.get('mode', 'fixed');
    if (cls >= 3 && cls <= 8) {
      this.scene.start('GameScene', { classLevel: cls, mode });
    } else {
      this.scene.start('MenuScene');
    }
  }
}
