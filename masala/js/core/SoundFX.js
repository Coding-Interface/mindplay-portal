/**
 * SoundFX
 * Tiny synthesised sound effects (Web Audio), so the game ships with no audio files.
 */
class SoundFX {
  constructor(storage) {
    this.storage = storage;
    this.muted = storage.get('muted', false);
    this.ctx = null;
  }

  ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      this.ctx = new AC();
    } catch (e) {
      this.ctx = null;
    }
    return this.ctx;
  }

  setMuted(m) {
    this.muted = m;
    this.storage.set('muted', m);
  }

  tone(freq, dur, type, vol, delay, slideTo) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  tap() { this.tone(660, 0.06, 'triangle', 0.12); }
  slide() { this.tone(300, 0.18, 'sine', 0.08, 0, 180); }
  bump() { this.tone(140, 0.12, 'square', 0.06); }
  drop() { this.tone(520, 0.1, 'triangle', 0.15); this.tone(780, 0.14, 'triangle', 0.12, 0.08); }
  blocked() { this.tone(200, 0.08, 'sawtooth', 0.05); this.tone(160, 0.1, 'sawtooth', 0.05, 0.08); }
  stuck() { this.tone(400, 0.2, 'sine', 0.1, 0, 220); }
  hint() { this.tone(880, 0.08, 'sine', 0.1); this.tone(1175, 0.12, 'sine', 0.1, 0.08); }
  /** Spice pouring: a soft falling rattle. */
  pour() { this.tone(900, 0.16, 'triangle', 0.06, 0, 420); this.tone(700, 0.14, 'triangle', 0.05, 0.08, 360); this.tone(520, 0.12, 'triangle', 0.04, 0.16, 300); }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.14, i * 0.1));
  }
}
