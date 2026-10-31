/**
 * SoundFX
 * Plays the game's recorded-style sound effects (assets/sfx/*.mp3) through
 * Phaser's sound manager: a different horn and engine for each vehicle,
 * sounds for each blocker, the traffic police whistle, the school bell, and
 * a looping street ambience. Remembers the mute setting.
 */
class SoundFX {
  constructor(storage, manager) {
    this.storage = storage;
    this.manager = manager;
    this.muted = storage.get('muted', false);
    this.ambience = null;
    this.last = {};
  }

  setMuted(m) {
    this.muted = m;
    this.storage.set('muted', m);
    if (this.ambience) {
      if (m) this.ambience.pause();
      else if (this.ambience.isPaused) this.ambience.resume();
      else this.ambience.play();
    }
  }

  /** Play a sound by key. minGap (ms) stops the same sound stacking up. */
  play(key, volume, minGap, rate) {
    if (this.muted || !this.manager || !this.manager.game.cache.audio.exists(key)) return;
    const now = performance.now();
    if (minGap && this.last[key] && now - this.last[key] < minGap) return;
    this.last[key] = now;
    this.manager.play(key, { volume: volume === undefined ? 0.8 : volume, rate: rate || 1, detune: 0 });
  }

  startAmbience() {
    if (!this.manager || !this.manager.game.cache.audio.exists('ambience')) return;
    if (!this.ambience) this.ambience = this.manager.add('ambience', { loop: true, volume: 0.32 });
    if (!this.muted && !this.ambience.isPlaying) this.ambience.play();
  }

  /** A vehicle's horn (each kind sounds different). */
  horn(kind, volume) {
    this.play(SoundFX.HORN[kind] || 'horn_car', volume === undefined ? 0.7 : volume, 250);
  }

  /** A short rev as a vehicle starts to move. */
  engine(kind) {
    this.play(SoundFX.ENGINE[kind] || 'engine_car', 0.55, 120, 0.95 + Math.random() * 0.1);
  }

  /** Sound for tapping something that never moves. */
  blocker(kind) {
    this.play(SoundFX.BLOCKER[kind] || 'bump', 0.75, 400);
  }

  /** Tyre screech as a vehicle brakes (louder for longer drives). */
  brake(cells) { this.play('brake', Math.min(0.7, 0.25 + (cells || 1) * 0.1), 120, 0.9 + Math.random() * 0.2); }
  whoosh() { this.play('whoosh', 0.45, 80); }
  tap() { this.play('tap', 0.6); }
  bump() { this.play('bump', 0.7, 150); }
  blocked() { this.play('bump', 0.6, 150); }
  hint() { this.play('hint', 0.6); }
  whistle() { this.play('whistle', 0.55, 600); }
  bell() { this.play('school_bell', 0.6); }
  win() { this.play('chime', 0.6); }
}

SoundFX.HORN = {
  van: 'horn_van', auto: 'horn_auto', car: 'horn_car', hatch: 'horn_hatch', sedan: 'horn_sedan',
  taxi: 'horn_taxi', tempo: 'horn_tempo', bus: 'horn_bus', truck: 'horn_truck', tanker: 'horn_tanker'
};

SoundFX.ENGINE = {
  auto: 'engine_light', tempo: 'engine_light',
  van: 'engine_car', car: 'engine_car', hatch: 'engine_car', sedan: 'engine_car', taxi: 'engine_car',
  bus: 'engine_heavy', truck: 'engine_heavy', tanker: 'engine_heavy'
};

SoundFX.BLOCKER = { cow: 'moo', barricade: 'clank', cart: 'cart_bell' };

/** Every sound file the game loads (assets/sfx/<key>.mp3). */
SoundFX.KEYS = [
  'horn_van', 'horn_auto', 'horn_car', 'horn_hatch', 'horn_sedan', 'horn_taxi', 'horn_tempo', 'horn_bus', 'horn_truck', 'horn_tanker',
  'engine_light', 'engine_car', 'engine_heavy', 'moo', 'clank', 'cart_bell', 'whistle', 'bump', 'tap',
  'school_bell', 'chime', 'hint', 'ambience', 'brake', 'whoosh'
];
