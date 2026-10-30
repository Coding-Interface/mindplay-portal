/**
 * GameView
 * A game's own page: player with poster and Play button, toolbar
 * (fullscreen, restart, new tab), how to play, skills, last result,
 * and more games.
 */
class GameView {
  static render(g, last) {
    const e = TileView.esc;
    const src = Catalog.urlFor(g);
    const more = Catalog.GAMES.filter(x => x.id !== g.id);
    return `
      <nav class="crumbs page-top" aria-label="Breadcrumb">
        <a href="#home">Home</a><span>›</span><a href="#planning">Planning</a><span>›</span><span>${e(g.title)}</span>
      </nav>
      <div class="game-layout">
        <div class="game-main">
          <div class="player" id="player" data-src="${e(src)}">
            <img class="player-poster" src="${e(g.poster)}" alt="${e(g.title)} start screen">
            <div class="player-shade"></div>
            <button class="player-start" id="playerStart" type="button">
              <span class="player-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>
              <span class="player-label">Play ${e(g.title)}</span>
            </button>
          </div>
          <div class="toolbar">
            <h1 class="game-title">${e(g.title)}</h1>
            <div class="toolbar-actions">
              <button class="tool" id="toolRestart" type="button" title="Restart">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg><span>Restart</span>
              </button>
              <button class="tool" id="toolFull" type="button" title="Fullscreen">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5v2H6v3H4zm10-5h6v5h-2V6h-4V4zM4 15h2v3h3v2H4v-5zm14 3v-3h2v5h-6v-2h4z"/></svg><span>Fullscreen</span>
              </button>
              <a class="tool" href="${e(src)}" target="_blank" rel="noopener" title="Open in a new tab">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"/></svg><span>New tab</span>
              </a>
            </div>
          </div>
          <p class="game-tagline">${e(g.tagline)}</p>
        </div>

        <aside class="game-side">
          <div class="card">
            <div class="chips">
              <span class="chip">${e(g.classes)}</span>
              <span class="chip">${e(g.world)}</span>
              ${g.isNew ? '<span class="chip chip-new">New</span>' : ''}
            </div>
            <p>${e(g.description)}</p>
            <h2>Skills trained</h2>
            <div class="chips">${g.skills.map(s => `<span class="chip chip-skill">${e(s)}</span>`).join('')}</div>
          </div>
          <div class="card" id="lastResult">${GameView.lastResult(g, last)}</div>
        </aside>
      </div>

      <section class="block">
        <div class="block-head"><h2>How to play</h2></div>
        <ol class="howto">${Catalog.howToFor(g).map(s => `<li>${e(s)}</li>`).join('')}</ol>
      </section>

      ${TileView.section('More games', '#all', more, 'All games')}`;
  }

  static lastResult(g, last) {
    const e = TileView.esc;
    if (!last) {
      return `<h2>Your last result</h2><p class="muted">Finish a session of 10 levels and your stars and planning score show up here.</p>`;
    }
    const when = last.at ? new Date(last.at).toLocaleDateString() : '';
    return `<h2>Your last result</h2>
      <div class="result">
        <div><strong>${e(last.stars)}/${e(last.maxStars)}</strong><span>stars</span></div>
        <div><strong>${e(last.planningScore)}%</strong><span>planning score</span></div>
        <div><strong>${e(last.perfectPlans)}/${e(last.levels)}</strong><span>perfect plans</span></div>
      </div>
      <p class="muted">Class ${e(last.classLevel)}${when ? ' · ' + e(when) : ''}</p>`;
  }

  /** Wire up the player after the HTML is in the page. */
  static mount(root, g, store) {
    const player = root.querySelector('#player');
    const start = root.querySelector('#playerStart');
    let frame = null;

    const load = () => {
      if (frame) return;
      frame = document.createElement('iframe');
      frame.className = 'player-frame';
      frame.src = player.dataset.src;
      frame.title = g.title;
      frame.setAttribute('allow', 'fullscreen; autoplay');
      frame.setAttribute('allowfullscreen', '');
      player.classList.add('is-playing');
      player.appendChild(frame);
      frame.focus();
    };
    start.addEventListener('click', load);

    root.querySelector('#toolRestart').addEventListener('click', () => {
      if (!frame) { load(); return; }
      frame.src = player.dataset.src;
    });

    root.querySelector('#toolFull').addEventListener('click', () => {
      load();
      const target = player;
      const req = target.requestFullscreen || target.webkitRequestFullscreen;
      if (!req) return;
      try {
        const p = req.call(target);
        if (p && p.catch) p.catch(() => player.classList.add('fs-refused'));
      } catch (err) {
        player.classList.add('fs-refused');
      }
    });

    store.onChange(id => {
      if (id !== g.id) return;
      const box = root.querySelector('#lastResult');
      if (box) box.innerHTML = GameView.lastResult(g, store.get(g.id));
    });
  }
}
