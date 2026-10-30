/**
 * main.js
 * Creates the Phaser game once the web font is ready.
 */
class AutoOutGame {
  static start() {
    window.autoOut = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: GameConfig.WIDTH,
      height: GameConfig.HEIGHT,
      backgroundColor: '#22313b',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, MenuScene, GameScene, SummaryScene]
    });
  }
}

window.addEventListener('load', () => {
  // the rotate overlay works even while the game is still loading
  window.orientationGuard = new OrientationGuard(GameConfig.ORIENTATION);
  const go = () => {
    AutoOutGame.start();
    window.orientationGuard.attach(window.autoOut);
  };
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('700 32px "Baloo 2"'), new Promise(r => setTimeout(r, 1500))]).then(go, go);
  } else {
    go();
  }
});
