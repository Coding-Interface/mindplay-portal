/**
 * main.js
 * Creates the Phaser game once the web font is ready.
 */
class MasalaSortGame {
  static start() {
    window.masalaSort = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: GameConfig.WIDTH,
      height: GameConfig.HEIGHT,
      backgroundColor: '#3b2a1c',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, MenuScene, GameScene, SummaryScene]
    });
  }
}

window.addEventListener('load', () => {
  // the rotate overlay works even while the game is still loading
  window.orientationGuard = new OrientationGuard(GameConfig.ORIENTATION);
  const go = () => {
    MasalaSortGame.start();
    window.orientationGuard.attach(window.masalaSort);
  };
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('700 32px "Baloo 2"'), new Promise(r => setTimeout(r, 1500))]).then(go, go);
  } else {
    go();
  }
});
