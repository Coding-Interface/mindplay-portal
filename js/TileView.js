/**
 * TileView
 * HTML for one game tile (thumbnail, badges, title, meta) and for tile grids.
 */
class TileView {
  static esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  static tile(g) {
    const e = TileView.esc;
    return `<a class="tile" href="#game-${e(g.id)}" style="--tile-accent:${e(g.accent)}">
      <span class="tile-media">
        <img src="${e(g.thumb)}" alt="${e(g.title)} gameplay" loading="lazy" width="640" height="360">
        ${g.isNew ? '<span class="badge badge-new">New</span>' : ''}
        <span class="tile-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
      </span>
      <span class="tile-body">
        <span class="tile-title">${e(g.title)}</span>
        <span class="tile-meta">${e(g.classes)} · ${e(g.skills[0])}</span>
      </span>
    </a>`;
  }

  static grid(games, extraClass) {
    if (!games.length) {
      return `<p class="empty">No games match yet.</p>`;
    }
    return `<div class="tile-grid ${extraClass || ''}">${games.map(TileView.tile).join('')}</div>`;
  }

  static section(title, href, games, linkLabel) {
    const e = TileView.esc;
    return `<section class="block">
      <div class="block-head">
        <h2><a href="${e(href)}">${e(title)}</a></h2>
        ${linkLabel ? `<a class="show-all" href="${e(href)}">${e(linkLabel)} ›</a>` : ''}
      </div>
      ${TileView.grid(games)}
    </section>`;
  }
}
