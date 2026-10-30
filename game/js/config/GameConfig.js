/**
 * GameConfig
 * Shared constants: canvas size, fonts, layout areas, theme-independent colours.
 */
class GameConfig {}

GameConfig.WIDTH = 1280;
GameConfig.HEIGHT = 720;
GameConfig.FONT = '"Baloo 2", "Trebuchet MS", Arial, sans-serif';
GameConfig.LEVELS_PER_SESSION = 10;
GameConfig.LEVEL_BANK_URL = 'data/levels.json';
GameConfig.ASSET_PATH = 'assets/';
GameConfig.STORAGE_PREFIX = 'fth-cog:';

// Board area (between HUD and bottom buttons)
GameConfig.BOARD = { x: 640, y: 372, maxW: 900, maxH: 460, maxCell: 92 };

// Theme-independent colours. Each theme (js/themes) defines its own palette.
GameConfig.COLORS = {
  arrow: 0xffd23f,
  arrowDark: 0xd19c00,
  star: 0xffd23f,
  good: 0x5fd068,
  warn: 0xff7b54
};

if (typeof module !== 'undefined') module.exports = GameConfig;
