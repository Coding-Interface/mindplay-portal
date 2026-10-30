/**
 * ResultStore
 * Remembers each viewer's last finished session per game (in this browser only).
 * Each game posts { type: '<game>-metrics', payload } to the portal when a
 * session ends; the game page shows the latest result under the player.
 */
class ResultStore {
  constructor() {
    this.key = 'mindplay:results';
    this.listeners = [];
    window.addEventListener('message', e => this.onMessage(e));
  }

  all() {
    try {
      return JSON.parse(window.localStorage.getItem(this.key) || '{}');
    } catch (err) {
      return this.memory || {};
    }
  }

  get(gameId) {
    return this.all()[gameId] || null;
  }

  onMessage(e) {
    const d = e.data;
    if (!d || !ResultStore.TYPES[d.type] || !d.payload || d.payload.kind !== 'session') return;
    const s = d.payload.session;
    if (!s || !s.summary) return;
    const gameId = ResultStore.TYPES[d.type](s);
    const rec = {
      stars: s.summary.stars,
      maxStars: s.summary.maxStars,
      planningScore: s.summary.planningScore,
      perfectPlans: s.summary.perfectPlans,
      levels: s.summary.levelsPlayed,
      classLevel: s.classLevel,
      at: s.endedAt
    };
    const all = this.all();
    all[gameId] = rec;
    this.memory = all;
    try { window.localStorage.setItem(this.key, JSON.stringify(all)); } catch (err) { /* memory only */ }
    this.listeners.forEach(fn => fn(gameId, rec));
  }

  onChange(fn) {
    this.listeners.push(fn);
  }
}

/** Message type → catalog id of the game that sent it. */
ResultStore.TYPES = {
  'fill-the-holes-metrics': s => s.theme || 'pothole',
  'masala-sort-metrics': () => 'masala',
  'auto-out-metrics': () => 'autoout'
};
