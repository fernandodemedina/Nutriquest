/* =========================================================
   NutriQuest — audio.js
   All sound effects are synthesized with the Web Audio API,
   so the game works fully offline with zero external audio
   files. Respects the settings.soundOn / settings.musicOn flags.
   ========================================================= */

class AudioManager {
  constructor(getSettings) {
    this.getSettings = getSettings; // () => { soundOn, musicOn }
    this.ctx = null;
    this.musicNodes = null;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _tone({ freq = 440, duration = 0.15, type = 'sine', gain = 0.15, delay = 0, glideTo = null }) {
    if (!this.getSettings().soundOn) return;
    const ctx = this._ensureCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    const start = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + duration);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  _chord(freqs, opts = {}) { freqs.forEach((f, i) => this._tone({ ...opts, freq: f, delay: (opts.delay || 0) + i * (opts.stagger || 0) })); }

  click()      { this._tone({ freq: 520, duration: 0.06, type: 'triangle', gain: 0.08 }); }
  correct()    { this._chord([523.25, 659.25, 783.99], { duration: 0.22, type: 'sine', gain: 0.14, stagger: 0.06 }); }
  incorrect()  { this._tone({ freq: 180, duration: 0.28, type: 'sawtooth', gain: 0.12, glideTo: 110 }); }
  coin()       { this._tone({ freq: 988, duration: 0.09, type: 'square', gain: 0.09 }); this._tone({ freq: 1318, duration: 0.12, type: 'square', gain: 0.09, delay: 0.06 }); }
  levelUp()    { this._chord([392, 523.25, 659.25, 783.99], { duration: 0.35, type: 'triangle', gain: 0.13, stagger: 0.09 }); }
  purchase()   { this._tone({ freq: 660, duration: 0.1, type: 'sine', gain: 0.1 }); this._tone({ freq: 880, duration: 0.14, type: 'sine', gain: 0.1, delay: 0.08 }); }
  scrollOpen() { this._tone({ freq: 300, duration: 0.5, type: 'sine', gain: 0.06, glideTo: 500 }); }
  worldUnlock(){ this._chord([261.6, 329.6, 392.0, 523.2], { duration: 0.5, type: 'triangle', gain: 0.12, stagger: 0.1 }); }
  powerup()    { this._tone({ freq: 700, duration: 0.12, type: 'square', gain: 0.09, glideTo: 1000 }); }
  navigate()   { this._tone({ freq: 440, duration: 0.08, type: 'sine', gain: 0.07 }); }

  /** Soft ambient pad loop — subtle background "music" made of slow sine layers. */
  startMusic() {
    if (!this.getSettings().musicOn) return;
    if (this.musicNodes) return;
    const ctx = this._ensureCtx();
    const master = ctx.createGain();
    master.gain.value = 0.035;
    master.connect(ctx.destination);
    const freqs = [130.81, 164.81, 196.0];
    const oscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.02;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      osc.connect(master);
      osc.start(); lfo.start();
      return { osc, lfo };
    });
    this.musicNodes = { master, oscs };
  }

  stopMusic() {
    if (!this.musicNodes) return;
    this.musicNodes.oscs.forEach(({ osc, lfo }) => { try { osc.stop(); lfo.stop(); } catch (e) {} });
    this.musicNodes = null;
  }

  refreshMusicState() {
    const s = this.getSettings();
    if (s.musicOn) this.startMusic(); else this.stopMusic();
  }
}

window.AudioManager = AudioManager;
