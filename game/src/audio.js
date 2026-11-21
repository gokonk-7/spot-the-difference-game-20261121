// Every sound in the game is synthesized with WebAudio oscillators, so the
// game ships no audio files and makes no network request. Sounds are short
// and soft: a pluck when a difference is found, a dull thud on a miss, a
// shimmer for a hint, a little arpeggio when a level is cleared, and a tick
// when the clock runs low. Nothing plays until the player has interacted
// with the page, which browsers require anyway.
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  // Lazily create the audio context on first user gesture.
  ensure() {
    if (!this.context) {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (Ctor) this.context = new Ctor();
      } catch {
        this.context = null;
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
    return this.context;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // One oscillator note with a quick attack and an exponential fade.
  note(freq, when, dur, type, gainValue) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + dur + 0.05);
  }

  // A warm two-note pluck for a found difference.
  pluck() {
    this.note(660, 0, 0.22, 'triangle', 0.16);
    this.note(990, 0.07, 0.28, 'triangle', 0.12);
  }

  // A soft low thud for a wrong click.
  thud() {
    this.note(140, 0, 0.18, 'sine', 0.18);
    this.note(90, 0.02, 0.22, 'sine', 0.12);
  }

  // A rising shimmer when a hint is spent.
  shimmer() {
    this.note(880, 0, 0.3, 'sine', 0.07);
    this.note(1174, 0.09, 0.3, 'sine', 0.07);
    this.note(1568, 0.18, 0.36, 'sine', 0.06);
  }

  // A small ascending arpeggio when a level is cleared.
  fanfare() {
    const steps = [523, 659, 784, 1046];
    steps.forEach((f, i) => this.note(f, i * 0.11, 0.32, 'triangle', 0.13));
  }

  // A quiet tick while the clock is under thirty seconds.
  tick() {
    this.note(1200, 0, 0.05, 'square', 0.04);
  }

  // A gentle click for menu buttons.
  click() {
    this.note(520, 0, 0.07, 'triangle', 0.08);
  }
}
