/**
 * OrientationGuard
 * Shows the "turn your device" overlay (#rotate-overlay in index.html,
 * styled by css/orientation.css) whenever a phone or tablet is held in an
 * orientation the game does not support, and pauses the game and its sound
 * until the device is turned back.
 *
 * Only touch devices are checked: on a desktop a tall browser window is not
 * blocked, because the game simply scales to fit.
 *
 *   const guard = new OrientationGuard('landscape');  // as early as possible
 *   guard.attach(phaserGame);                         // once the game exists
 */
class OrientationGuard {
  constructor(supported) {
    this.supported = supported === 'portrait' ? 'portrait' : 'landscape';
    this.overlay = document.getElementById('rotate-overlay');
    this.game = null;
    this.blocked = false;
    this.wasMuted = false;
    if (this.overlay) {
      const title = this.overlay.querySelector('.rotate-title');
      const note = this.overlay.querySelector('.rotate-note');
      if (title) title.textContent = this.supported === 'landscape' ? 'Please turn your device sideways' : 'Please hold your device upright';
      if (note) note.textContent = 'This game is played in ' + this.supported + ' mode.';
      this.overlay.classList.toggle('wants-portrait', this.supported === 'portrait');
    }
    const check = () => this.check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', () => setTimeout(check, 150));
    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener('change', check);
    }
    this.check();
  }

  attach(game) {
    this.game = game;
    if (this.blocked) this.pauseGame();
  }

  isTouchDevice() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return coarse || (navigator.maxTouchPoints || 0) > 0;
  }

  /** 'portrait' or 'landscape' for the device (not just this frame). */
  current() {
    const so = window.screen && window.screen.orientation;
    if (so && typeof so.type === 'string') return so.type.indexOf('portrait') === 0 ? 'portrait' : 'landscape';
    if (typeof window.orientation === 'number') return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  check() {
    const block = this.isTouchDevice() && this.current() !== this.supported;
    if (block === this.blocked) return;
    this.blocked = block;
    if (this.overlay) this.overlay.hidden = !block;
    document.body.classList.toggle('is-rotate-blocked', block);
    if (block) this.pauseGame();
    else this.resumeGame();
  }

  pauseGame() {
    const g = this.game;
    if (!g) return;
    if (g.sound && !this.soundHeld) {
      this.soundHeld = true;
      this.wasMuted = g.sound.mute;
      g.sound.mute = true;
    }
    if (g.isRunning) {
      if (!g.isPaused) g.pause();
    } else if (!this.waitingForBoot) {
      // the game is still booting: pause as soon as it is ready
      this.waitingForBoot = true;
      // 'ready' fires just before Phaser marks the game as running
      g.events.once('ready', () => setTimeout(() => {
        this.waitingForBoot = false;
        if (this.blocked) this.pauseGame();
      }, 0));
    }
  }

  resumeGame() {
    const g = this.game;
    if (!g) return;
    if (g.isPaused) g.resume();
    if (g.sound && this.soundHeld) {
      this.soundHeld = false;
      g.sound.mute = this.wasMuted;
    }
    // the game missed the resize while paused: re-fit once the page has re-laid out
    if (g.scale) {
      const refit = () => g.scale.refresh();
      refit();
      requestAnimationFrame(refit);
      setTimeout(refit, 150);
      setTimeout(refit, 500);
    }
  }
}
