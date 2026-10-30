/**
 * SafeStorage
 * localStorage wrapper that never throws (private windows, blocked storage,
 * embedded iframes). Falls back to memory for the current page.
 */
class SafeStorage {
  constructor(prefix) {
    this.prefix = prefix || '';
    this.memory = {};
  }

  get(key, fallback) {
    let raw = null;
    try {
      raw = window.localStorage.getItem(this.prefix + key);
    } catch (e) {
      raw = this.memory[key] !== undefined ? this.memory[key] : null;
    }
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  set(key, value) {
    const raw = JSON.stringify(value);
    this.memory[key] = raw;
    try {
      window.localStorage.setItem(this.prefix + key, raw);
    } catch (e) {
      /* memory only */
    }
  }
}
