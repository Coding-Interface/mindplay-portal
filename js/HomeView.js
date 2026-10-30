/**
 * HomeView
 * Featured banner, the new games, brain skills, and a note for teachers.
 */
class HomeView {
  static render() {
    const e = TileView.esc;
    const featured = Catalog.game('pothole');
    const games = Catalog.GAMES.filter(g => g.world === 'Fill the Holes');

    const skills = Catalog.CATEGORIES.filter(c => c.skill).map(c => {
      const n = Catalog.gamesIn(c.id).length;
      return `<a class="skill ${c.soon ? 'skill-soon' : ''}" href="#${e(c.id)}">
        <span class="skill-name">${e(c.label)}</span>
        <span class="skill-count">${c.soon ? 'Coming soon' : n + (n === 1 ? ' game' : ' games')}</span>
      </a>`;
    }).join('');

    return `
      <section class="hero" style="background-image:url('${e(featured.wide)}')">
        <div class="hero-shade"></div>
        <div class="hero-text">
          <span class="badge badge-new">New</span>
          <h1>Fill the Holes</h1>
          <p class="hero-sub">One puzzle, four real-life worlds. Everything slides in a straight line until something stops it. Plan the order, fill every hole.</p>
          <div class="hero-actions">
            <a class="btn btn-play" href="#game-${e(featured.id)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Play now
            </a>
            <a class="btn btn-ghost" href="#planning">All four worlds</a>
          </div>
        </div>
        <div class="hero-worlds" aria-hidden="true">
          ${games.map(g => `<img src="${e(g.thumb)}" alt="">`).join('')}
        </div>
      </section>

      ${TileView.section('New', '#new', Catalog.gamesIn('new'), 'Show all')}

      <section class="block">
        <div class="block-head"><h2>Train a brain skill</h2></div>
        <div class="skills">${skills}</div>
      </section>

      <section class="block teachers">
        <div class="teachers-text">
          <h2>For teachers and parents</h2>
          <p>Every game here records more than a score: think time before the first move, moves against the best possible plan, dead ends, undos and hints. The results screen shows a planning score, and a JSON report can be downloaded.</p>
        </div>
        <ul class="facts">
          <li><strong>10</strong><span>levels per session</span></li>
          <li><strong>${Catalog.PUZZLE_COUNT}</strong><span>solver-checked puzzles</span></li>
          <li><strong>2</strong><span>grade bands, Class 3–5 and 6–8</span></li>
        </ul>
      </section>`;
  }
}
