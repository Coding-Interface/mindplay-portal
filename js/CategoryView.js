/**
 * CategoryView
 * A category page (New, Planning, …, All games) or search results.
 */
class CategoryView {
  static render(categoryId, query) {
    const e = TileView.esc;
    if (query) {
      const found = Catalog.search(query);
      return `<section class="block page-top">
        <div class="block-head"><h1 class="page-title">Search: “${e(query)}”</h1></div>
        ${found.length ? TileView.grid(found) : `<p class="empty">No game matches “${e(query)}”. Try “marble”, “water” or “planning”.</p>`}
      </section>`;
    }
    const c = Catalog.category(categoryId) || Catalog.category('all');
    const games = Catalog.gamesIn(c.id);
    const body = c.soon
      ? `<div class="soon">
          <h2>${e(c.label)} games are on the way</h2>
          <p>New brain games for ${e(c.label.toLowerCase())} are being built. Meanwhile, try a planning game.</p>
          <a class="btn btn-play" href="#planning">Play a planning game</a>
        </div>`
      : TileView.grid(games);
    return `<section class="block page-top">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>›</span><span>${e(c.label)}</span></nav>
      <div class="block-head"><h1 class="page-title">${e(c.label)}</h1><span class="count">${c.soon ? '' : games.length + ' games'}</span></div>
      ${body}
    </section>`;
  }
}
