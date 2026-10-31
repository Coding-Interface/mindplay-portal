/**
 * MetricsTracker
 * Records what the child does so a teacher/platform sees cognitive data,
 * not just a score.
 *
 * Per level:
 *  planningTimeMs   time from level start to the first move (thinking before acting)
 *  moveIntervalMs   average time between moves
 *  moves            slides made in the final attempt (incl. undone ones)
 *  movesAllAttempts slides across every attempt of this level
 *  optimal          shortest possible solution
 *  efficiency       optimal / moves (1.0 = perfect plan)
 *  deadEnds         always 0 here (every slide can be reversed); kept so reports match the other games
 *  restarts, undos, hints, blockedAttempts (tried to move a vehicle that could not go that way)
 *
 * Output:
 *  - window event 'cognitive-metrics' (detail = payload) after every level and at the end
 *  - window.parent.postMessage({ type: 'auto-out-metrics', payload })
 *  - history in localStorage (last 20 sessions)
 *  - downloadable JSON from the summary screen
 */
class MetricsTracker {
  constructor(info, storage) {
    this.storage = storage;
    this.session = {
      game: 'get-the-auto-out',
      version: 1,
      sessionId: info.sessionId,
      classLevel: info.classLevel,
      band: info.band,
      mode: info.mode,
      theme: info.theme || null,
      bankVersion: info.bankVersion,
      startedAt: new Date().toISOString(),
      endedAt: null,
      levels: [],
      summary: null
    };
    this.current = null;
  }

  now() {
    return (typeof performance !== 'undefined' ? performance.now() : Date.now());
  }

  beginLevel(levelNumber, record, slotUsed) {
    this.current = {
      level: levelNumber,
      levelId: record.id,
      slot: slotUsed + 1,
      optimal: record.optimal,
      trapRatio: record.trapRatio,
      vehicles: record.vehicles.length,
      cows: record.vehicles.filter(v => v.fixed).length,
      solved: false,
      skipped: false,
      stars: 0,
      moves: 0,
      movesAllAttempts: 0,
      efficiency: 0,
      planningTimeMs: null,
      moveIntervalMs: null,
      totalTimeMs: 0,
      restarts: 0,
      undos: 0,
      hints: 0,
      deadEnds: 0,
      blockedAttempts: 0
    };
    this.levelStart = this.now();
    this.attemptStart = this.levelStart;
    this.lastMoveAt = null;
    this.intervals = [];
  }

  move() {
    const c = this.current;
    const t = this.now();
    if (c.planningTimeMs === null) c.planningTimeMs = Math.round(t - this.levelStart);
    if (this.lastMoveAt !== null) this.intervals.push(t - this.lastMoveAt);
    this.lastMoveAt = t;
    c.moves++;
    c.movesAllAttempts++;
  }

  blocked() { this.current.blockedAttempts++; }
  undo() { this.current.undos++; }
  hint() { this.current.hints++; }
  deadEnd() { this.current.deadEnds++; }

  restart() {
    this.current.restarts++;
    this.current.moves = 0;
    this.lastMoveAt = null;
  }

  /**
   * @param {{solved:boolean, skipped?:boolean, stars:number}} outcome
   */
  endLevel(outcome) {
    const c = this.current;
    c.solved = !!outcome.solved;
    c.skipped = !!outcome.skipped;
    c.stars = outcome.stars || 0;
    c.totalTimeMs = Math.round(this.now() - this.levelStart);
    c.efficiency = c.solved && c.moves > 0 ? Math.round((c.optimal / c.moves) * 100) / 100 : 0;
    c.moveIntervalMs = this.intervals.length
      ? Math.round(this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length)
      : null;
    this.session.levels.push(c);
    this.current = null;
    this.emit('level');
    return c;
  }

  finish() {
    const L = this.session.levels;
    const solved = L.filter(l => l.solved);
    const unassisted = solved.filter(l => l.hints === 0);
    const avg = (arr, f) => arr.length ? arr.reduce((a, l) => a + f(l), 0) / arr.length : 0;
    const planned = L.filter(l => l.planningTimeMs !== null);

    this.session.endedAt = new Date().toISOString();
    this.session.summary = {
      levelsPlayed: L.length,
      levelsSolved: solved.length,
      levelsSkipped: L.filter(l => l.skipped).length,
      stars: L.reduce((a, l) => a + l.stars, 0),
      maxStars: L.length * 3,
      perfectPlans: unassisted.filter(l => l.moves === l.optimal).length,
      // 0-100: how close unassisted solutions were to the shortest plan
      planningScore: Math.round(avg(unassisted, l => l.efficiency) * 100),
      avgPlanningTimeMs: Math.round(avg(planned, l => l.planningTimeMs)),
      totalDeadEnds: L.reduce((a, l) => a + l.deadEnds, 0),
      totalBlocked: L.reduce((a, l) => a + (l.blockedAttempts || 0), 0),
      totalHints: L.reduce((a, l) => a + l.hints, 0),
      totalUndos: L.reduce((a, l) => a + l.undos, 0),
      totalRestarts: L.reduce((a, l) => a + l.restarts, 0),
      totalTimeMs: L.reduce((a, l) => a + l.totalTimeMs, 0)
    };

    const history = this.storage.get('history', []);
    history.push(this.session);
    this.storage.set('history', history.slice(-20));
    this.emit('session');
    return this.session;
  }

  emit(kind) {
    const payload = { kind, session: this.session };
    try {
      window.dispatchEvent(new CustomEvent('cognitive-metrics', { detail: payload }));
    } catch (e) { /* ignore */ }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'auto-out-metrics', payload }, '*');
      }
    } catch (e) { /* ignore */ }
  }

  toJSONString() {
    return JSON.stringify(this.session, null, 2);
  }
}
