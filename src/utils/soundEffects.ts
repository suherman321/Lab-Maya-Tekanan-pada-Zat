/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Sound of nail moving down through air (short subtle whoosh)
   */
  playWhoosh() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Audio not supported or blocked
    }
  }

  /**
   * Sound of nail hitting wood surface without penetrating (metallic clank + dull thud)
   */
  playSurfaceThud() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // 1. Wood dull thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      // 2. High metallic click
      const clank = this.ctx.createOscillator();
      const clankGain = this.ctx.createGain();
      clank.type = 'square';
      clank.frequency.setValueAtTime(820, t);
      clank.frequency.exponentialRampToValueAtTime(400, t + 0.08);
      clankGain.gain.setValueAtTime(0.12, t);
      clankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      clank.connect(clankGain);
      clankGain.connect(this.ctx.destination);
      clank.start(t);
      clank.stop(t + 0.08);
    } catch {
      // Audio blocked
    }
  }

  /**
   * Sound of nail penetrating deep into wood fibers (heavy impact + wood crunching crack)
   */
  playPenetrationCrack() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // Heavy sub-bass impact
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(160, t);
      sub.frequency.exponentialRampToValueAtTime(25, t + 0.28);
      subGain.gain.setValueAtTime(0.5, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(t);
      sub.stop(t + 0.28);

      // Wood fiber crunching noise burst
      const bufferSize = this.ctx.sampleRate * 0.25;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.linearRampToValueAtTime(400, t + 0.25);
      filter.Q.value = 3;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.25);
    } catch {
      // Audio blocked
    }
  }

  /**
   * Sound of pulling nail back up / reset
   */
  playReset() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.2);

      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {
      // Audio blocked
    }
  }

  /**
   * Sound of underwater air bubbles (rapid gentle popping frequency sweeps)
   */
  playUnderwaterBubbles() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.05 + Math.random() * 0.02;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startFreq = 300 + Math.random() * 200;
        osc.frequency.setValueAtTime(startFreq, t + offset);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, t + offset + 0.06);

        gain.gain.setValueAtTime(0.04, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.06);
      }
    } catch {
      // Audio blocked
    }
  }
}

export const soundManager = new SoundSynthesizer();
