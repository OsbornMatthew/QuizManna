// Pure Web Audio API Synthesizer - 100% offline & instantaneous

class SoundController {
  private ctx: AudioContext | null = null;
  public isSoundEnabled: boolean = true;
  public isVibrationEnabled: boolean = true;

  constructor() {
    // Lazy initialize on first user gesture
    this.isSoundEnabled = localStorage.getItem('sound_enabled') !== 'false';
    this.isVibrationEnabled = localStorage.getItem('vibration_enabled') !== 'false';
  }

  private getAudioContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleSound(): boolean {
    this.isSoundEnabled = !this.isSoundEnabled;
    localStorage.setItem('sound_enabled', String(this.isSoundEnabled));
    return this.isSoundEnabled;
  }

  public toggleVibration(): boolean {
    this.isVibrationEnabled = !this.isVibrationEnabled;
    localStorage.setItem('vibration_enabled', String(this.isVibrationEnabled));
    return this.isVibrationEnabled;
  }

  public vibrate(pattern: number | number[] = 50) {
    if (this.isVibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration failure if blocked
      }
    }
  }

  // Melodic celestial chime for correct answer
  public playCorrect() {
    if (!this.isSoundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate([40, 60, 40]);

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord arpeggio
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  }

  // Gentle low tone for wrong answer
  public playWrong() {
    if (!this.isSoundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate(150);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Quick tactile tick for click / timer warning
  public playTick() {
    if (!this.isSoundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Magic lifeline whoosh sound
  public playLifeline() {
    if (!this.isSoundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate(60);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Victory fanfare on finishing quiz
  public playVictory() {
    if (!this.isSoundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate([100, 100, 100, 100, 200]);

    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.4 }, // C6
    ];

    let t = ctx.currentTime;
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.05);

      t += note.d + 0.04;
    });
  }
}

export const sounds = new SoundController();
