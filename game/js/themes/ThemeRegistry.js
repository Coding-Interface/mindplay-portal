/**
 * ThemeRegistry
 * Holds the available themes and the one in use.
 * Choose with the menu, ?theme=pothole|kanche|fields|parking, or #<id>.
 */
class ThemeRegistry {
  static all() {
    if (!ThemeRegistry._all) {
      ThemeRegistry._all = [new PotholeTheme(), new KancheTheme(), new FieldsTheme(), new ParkingTheme()];
    }
    return ThemeRegistry._all;
  }

  static get(id) {
    return ThemeRegistry.all().find(t => t.id === id) || ThemeRegistry.all()[0];
  }

  static use(id) {
    ThemeRegistry.current = ThemeRegistry.get(id);
    return ThemeRegistry.current;
  }

  /** Theme asked for in the URL, if any. */
  static fromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('theme') || window.location.hash.replace('#', '');
    return ThemeRegistry.all().some(t => t.id === q) ? q : null;
  }

  static buildAll(scene) {
    ThemeRegistry.all().forEach(t => t.buildTextures(scene));
  }
}

ThemeRegistry.current = null;
