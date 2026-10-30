/**
 * PortalApp
 * Builds the header navigation and footer from the catalog, handles search,
 * and renders the view the router picks.
 */
class PortalApp {
  constructor() {
    this.view = document.getElementById('view');
    this.store = new ResultStore();
    this.query = '';
    this.buildChrome();
    this.router = new Router(r => this.show(r));
    this.router.resolve();
  }

  buildChrome() {
    const e = TileView.esc;
    document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = Catalog.SITE.name; });
    document.querySelectorAll('[data-site-year]').forEach(el => { el.textContent = Catalog.SITE.year; });

    const links = [{ id: 'home', label: 'Home' }].concat(Catalog.CATEGORIES)
      .map(c => `<a href="#${e(c.id)}" data-cat="${e(c.id)}">${e(c.label)}${c.soon ? '<small>soon</small>' : ''}</a>`).join('');
    document.getElementById('catBar').innerHTML = links;
    document.getElementById('footNav').innerHTML = links;

    const input = document.getElementById('search');
    const form = document.getElementById('searchForm');
    form.addEventListener('submit', ev => ev.preventDefault());
    input.addEventListener('input', () => {
      this.query = input.value;
      if (this.query.trim()) {
        this.render(CategoryView.render('all', this.query), 'all');
      } else {
        this.router.resolve();
      }
    });
  }

  show(r) {
    const input = document.getElementById('search');
    if (input.value) { input.value = ''; this.query = ''; }
    if (r.view === 'game') {
      this.render(GameView.render(r.game, this.store.get(r.game.id)), 'planning');
      GameView.mount(this.view, r.game, this.store);
      document.title = r.game.title + ' · ' + Catalog.SITE.name;
    } else if (r.view === 'category') {
      this.render(CategoryView.render(r.category), r.category);
      document.title = Catalog.category(r.category).label + ' · ' + Catalog.SITE.name;
    } else {
      this.render(HomeView.render(), 'home');
      document.title = Catalog.SITE.name;
    }
    window.scrollTo(0, 0);
  }

  render(html, activeCat) {
    this.view.innerHTML = html;
    document.querySelectorAll('#catBar a').forEach(a => {
      a.classList.toggle('is-active', a.dataset.cat === activeCat);
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new PortalApp());
else new PortalApp();
