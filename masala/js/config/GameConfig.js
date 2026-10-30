/**
 * GameConfig
 * Canvas size, fonts, jar geometry, layout and palette.
 */
class GameConfig {}

GameConfig.WIDTH = 1280;
GameConfig.HEIGHT = 720;
GameConfig.FONT = '"Baloo 2", "Trebuchet MS", Arial, sans-serif';
GameConfig.LEVELS_PER_SESSION = 10;
GameConfig.LEVEL_BANK_URL = 'data/levels.json';
GameConfig.ASSET_PATH = 'assets/';
GameConfig.STORAGE_PREFIX = 'masala:';

// Jar art geometry (see tools/assets/KitchenAssets.js)
GameConfig.JAR = { w: 160, innerW: 100, top: 60, scoop: 50, heights: { 3: 240, 4: 290 } };

// Area for the shelves, between the HUD and the buttons
GameConfig.SHELF_AREA = { top: 138, bottom: 618, maxRowWidth: 1180 };

GameConfig.COLORS = {
  panel: 0x3b2a1c,
  panelLine: 0xffc23d,
  tipBg: '#4a3523',
  tipWarn: '#a8321f',
  text: '#ffffff',
  textDim: '#f3e6d2',
  dotEmpty: 0x6b5038,
  btnDark: 0x6b5038,
  btnDarkShade: 0x46321f,
  accent: 0xffc23d,
  accentDark: 0xc98f00,
  star: 0xffd23f,
  good: 0x5fd068,
  warn: 0xff7b54
};

if (typeof module !== 'undefined') module.exports = GameConfig;
