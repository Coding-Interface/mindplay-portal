/**
 * SeededRandom
 * Small deterministic PRNG (mulberry32) so a level can be regenerated
 * exactly from its seed (useful for teachers, bug reports and replays).
 */
class SeededRandom {
  constructor(seed) {
    this.seed = SeededRandom.normalise(seed);
    this.state = this.seed;
  }

  static normalise(seed) {
    if (typeof seed === 'number' && isFinite(seed)) return seed >>> 0;
    return SeededRandom.hashString(String(seed));
  }

  /** FNV-1a string hash -> uint32 */
  static hashString(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /** Random session seed (6 chars, easy to read out loud). */
  static randomSeedString() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  /** float in [0,1) */
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** integer in [min, max] inclusive */
  between(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }
}

if (typeof module !== 'undefined') module.exports = SeededRandom;
