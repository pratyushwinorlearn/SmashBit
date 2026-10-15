import { ShotType } from '../../../server/src/types/packets.js';

export class SoundDirector {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playRacketHit(shotType: ShotType, isSweetSpot: boolean): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = shotType === 'JUMP_SMASH' ? 'sawtooth' : 'triangle';

    const startFreq = shotType === 'JUMP_SMASH' ? 320 : isSweetSpot ? 520 : 280;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

    gain.gain.setValueAtTime(shotType === 'JUMP_SMASH' ? 0.55 : 0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    this.playNoiseBurst(0.06, shotType === 'JUMP_SMASH' ? 1800 : 2800, 0.35);

    if (shotType === 'JUMP_SMASH') {
      this.playCrowdGasp();
    }
  }

  public playNetCord(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.07);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playShoeSqueak(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(3100, now + 0.045);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playCrowdGasp(): void {
    this.playNoiseBurst(0.32, 950, 0.18);
  }

  public playCrowdCheer(excitement: number): void {
    const duration = 0.65 + excitement * 0.7;
    this.playNoiseBurst(duration, 1200, 0.28 + excitement * 0.25);
  }

  /**
   * Classic 16-bit GBA Pokémon-style Championship Victory Trumpet Fanfare!
   */
  public playVictoryFanfare(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, delay: 0.0, dur: 0.14 }, // C5
      { freq: 523.25, delay: 0.16, dur: 0.14 }, // C5
      { freq: 523.25, delay: 0.32, dur: 0.14 }, // C5
      { freq: 523.25, delay: 0.48, dur: 0.38 }, // C5
      { freq: 415.3, delay: 0.88, dur: 0.36 },  // G#4
      { freq: 466.16, delay: 1.26, dur: 0.36 }, // A#4
      { freq: 523.25, delay: 1.64, dur: 0.22 }, // C5
      { freq: 466.16, delay: 1.9, dur: 0.14 },  // A#4
      { freq: 523.25, delay: 2.06, dur: 0.75 }  // C5 Held!
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.freq, now + n.delay);
      gain.gain.setValueAtTime(0.18, now + n.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.delay + n.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.delay);
      osc.stop(now + n.delay + n.dur + 0.02);
    });

    this.playCrowdCheer(1.0);
  }

  private playNoiseBurst(duration: number, centerFreq: number, volume: number): void {
    const ctx = this.ensureContext();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  }
}