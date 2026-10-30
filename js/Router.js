/**
 * Router
 * Reads location.hash and tells the app which view to show:
 *   #home (or none)  → home
 *   #game-<id>       → game page
 *   #<category>      → category page (new, planning, all, …)
 */
class Router {
  constructor(onRoute) {
    this.onRoute = onRoute;
    window.addEventListener('hashchange', () => this.resolve());
  }

  resolve() {
    const h = (window.location.hash || '').replace('#', '');
    if (!h || h === 'home') return this.onRoute({ view: 'home' });
    if (h.indexOf('game-') === 0) {
      const g = Catalog.game(h.slice(5));
      return this.onRoute(g ? { view: 'game', game: g } : { view: 'home' });
    }
    if (Catalog.category(h)) return this.onRoute({ view: 'category', category: h });
    return this.onRoute({ view: 'home' });
  }
}
