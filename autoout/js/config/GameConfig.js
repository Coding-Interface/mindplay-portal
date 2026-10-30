/**
 * GameConfig
 * Canvas size, fonts, scene layout and palette.
 * The street art (tools/assets/StreetAssets.js) is drawn around LOT and SCENE,
 * so keep the two in step if you move things.
 */
class GameConfig {
  /**
   * Board geometry for a lot size: top-left corner, cell size, gate row.
   * Every lot fills (almost) the same square, so bigger lots get smaller cells.
   */
  static boardFor(size) {
    const L = GameConfig.LOT;
    const cell = Math.floor(L.side / size);
    const px = cell * size;
    return {
      size,
      cell,
      px,
      x: L.x + Math.floor((L.side - px) / 2),
      y: L.y + Math.floor((L.side - px) / 2),
      gateRow: size <= 6 ? 2 : 3
    };
  }
}

GameConfig.WIDTH = 1280;
GameConfig.HEIGHT = 720;
GameConfig.FONT = '"Baloo 2", "Trebuchet MS", Arial, sans-serif';
GameConfig.LEVELS_PER_SESSION = 10;
GameConfig.LEVEL_BANK_URL = 'data/levels.json';
GameConfig.ASSET_PATH = 'assets/';
GameConfig.SFX_PATH = 'assets/sfx/';
GameConfig.STORAGE_PREFIX = 'autoout:';

/** The square the parking lot fills (pixels). 6×6 → 82 px cells, 7×7 → 70, 8×8 → 62. */
GameConfig.LOT = { x: 330, y: 92, side: 496 };

/** Fixed parts of the street scene (pixels), shared by the art and the game. */
GameConfig.SCENE = {
  mainRoad: { x: 196, w: 104 },     // vertical main road on the left, two lanes
  footpathRight: { x: 840, w: 44 }, // footpath between the lot and the school wall
  wall: { x: 884, w: 14 },          // school compound wall
  campus: { x: 898 },               // school grounds start here
  bottomBar: 640                    // the button bar starts here
};

GameConfig.COLORS = {
  panel: 0x1d2a33,
  panelLine: 0xffd23f,
  tipBg: '#fffaf0',
  tipText: '#1d2a33',
  tipWarn: '#ffe1d6',
  text: '#ffffff',
  textDim: '#d4e0e8',
  dotEmpty: 0x46596a,
  btnDark: 0x37505f,
  btnDarkShade: 0x1f2f39,
  accent: 0xffd23f,
  accentDark: 0xd19c00,
  star: 0xffd23f,
  good: 0x5fd068,
  warn: 0xff7b54
};

if (typeof module !== 'undefined') module.exports = GameConfig;
