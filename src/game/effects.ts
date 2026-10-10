import { Particle, BlastWave, DamageNumber } from './types';
import { getAssetUrl } from '../utils/assets';

type SoundId =
  | 'bg_music'
  | 'click'
  | 'start'
  | 'shot_double'
  | 'shot_triple'
  | 'shot_explosive'
  | 'shot_grenade'
  | 'explosion_small'
  | 'explosion_medium'
  | 'explosion_large'
  | 'explosion_explosive'
  | 'explosion_grenade';

export class EffectManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers = new Map<SoundId, AudioBuffer>();
  private loadingSounds = new Map<SoundId, Promise<AudioBuffer | null>>();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private audioPrimed = false;
  private muted = false;

  private readonly soundFiles: Record<SoundId, string> = {
    bg_music: 'fondosonido.mp3',
    click: 'click.wav',
    start: 'start.wav',
    shot_double: 'shot_double.wav',
    shot_triple: 'shot_triple.wav',
    shot_explosive: 'shot_explosive.wav',
    shot_grenade: 'shot_grenade.wav',
    explosion_small: 'explosion_small.wav',
    explosion_medium: 'explosion_medium.wav',
    explosion_large: 'explosion_large.wav',
    explosion_explosive: 'explosion_explosive.wav',
    explosion_grenade: 'explosion_grenade.wav'
  };

  constructor() {
    // Preload the complete sound pack. The game still works if one asset
    // fails to load because the procedural fallback sounds remain available.
    void this.preloadSounds();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioContext) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtor) return null;
        this.audioContext = new AudioCtor();
      }
      if (this.audioContext.state === 'suspended' && !this.muted) void this.audioContext.resume();
      return this.audioContext;
    } catch {
      return null;
    }
  }

  private async loadSound(id: SoundId): Promise<AudioBuffer | null> {
    const cached = this.soundBuffers.get(id);
    if (cached) return cached;

    const existing = this.loadingSounds.get(id);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const response = await fetch(getAssetUrl(`assets/sonido/${this.soundFiles[id]}`));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        const ctx = this.getAudioContext();
        if (!ctx) return null;
        const buffer = await ctx.decodeAudioData(data);
        this.soundBuffers.set(id, buffer);
        return buffer;
      } catch {
        return null;
      } finally {
        this.loadingSounds.delete(id);
      }
    })();

    this.loadingSounds.set(id, promise);
    return promise;
  }

  private async preloadSounds() {
    await Promise.all(
      (Object.keys(this.soundFiles) as SoundId[]).map((id) => this.loadSound(id))
    );
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      if (this.audioContext && this.audioContext.state === 'running') void this.audioContext.suspend();
      if (this.musicSource) { try { this.musicSource.stop(); } catch {} this.musicSource = null; this.musicGain = null; }
      return;
    }
    if (this.audioContext && this.audioContext.state === 'suspended') void this.audioContext.resume();
    // Background music is managed once by App.tsx. Do not start a second loop here.
  }

  private playSound(id: SoundId, volume = 1, loop = false) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const buffer = this.soundBuffers.get(id);
    if (!buffer) {
      void this.loadSound(id).then((loaded) => {
        if (loaded) this.playSound(id, volume, loop);
      });
      return;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();

    source.buffer = buffer;
    source.loop = loop;
    // The original files are intentionally amplified through a gain node.
    // Values above 1 are safe here and make quiet WAV assets much more audible.
    gain.gain.setValueAtTime(Math.max(0, volume), ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    if (loop) {
      if (this.musicSource) {
        try { this.musicSource.stop(); } catch {}
      }
      this.musicSource = source;
      this.musicGain = gain;
    }
  }

  private playTone(start: number, end: number, duration: number, volume: number, type: OscillatorType = 'triangle') {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private startMusic() {
    if (this.musicSource) return;
    this.playSound('bg_music', 0.22, true);
  }

  public primeAudio() {
    if (this.muted || this.audioPrimed) return;
    this.audioPrimed = true;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    void ctx.resume();
    // App.tsx owns the single looping background track; this manager only plays effects.
    this.playSound('start', 1.8);
  }

  public playClick() {
    this.primeAudio();
    this.playSound('click', 1.8);
  }

  public playShot(power = 60, powerUpType?: string | null) {
    this.primeAudio();

    if (powerUpType === 'double_hit') {
      this.playSound('shot_double', 2.2);
      return;
    }
    if (powerUpType === 'triple_hit') {
      this.playSound('shot_triple', 2.2);
      return;
    }
    if (powerUpType === 'mega_bomb') {
      this.playSound('shot_explosive', 2.2);
      return;
    }
    if (powerUpType === 'grenade') {
      this.playSound('shot_grenade', 2.2);
      return;
    }

    // There is no normal-shot WAV in the supplied pack, so keep a louder
    // procedural cannon sound as the fallback for the standard missile.
    this.playTone(210 + power * 1.2, 75, 0.18, 0.14, 'sawtooth');
  }

  public playImpact(isWater = false, explosionRadius = 70, powerUpType?: string | null) {
    this.primeAudio();

    if (powerUpType === 'grenade') {
      this.playSound('explosion_grenade', 2.4);
      return;
    }
    if (powerUpType === 'mega_bomb') {
      this.playSound('explosion_explosive', 2.4);
      return;
    }

    if (isWater) {
      this.playSound('explosion_medium', 2.0);
      return;
    }

    const id: SoundId =
      explosionRadius >= 125 ? 'explosion_large' :
      explosionRadius >= 80 ? 'explosion_medium' :
      'explosion_small';

    this.playSound(id, 2.2);
  }

  public playPickup() {
    this.primeAudio();
    this.playSound('click', 1.7);
    this.playTone(620, 1050, 0.16, 0.07, 'sine');
  }

  public playGrenadeBounce() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playGrenadeRoll() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playGrenadeExplosion() {
    this.primeAudio();
    // Keep the supplied grenade explosion as the main sound; this lower
    // procedural layer adds extra punch without replacing the asset.
    this.playSound('explosion_grenade', 2.4);
    this.playTone(110, 38, 0.42, 0.18, 'sawtooth');
  }

  public particles: Particle[] = [];
  public blastWaves: BlastWave[] = [];
  public damageNumbers: DamageNumber[] = [];

  public createExplosion(x: number, y: number, radius: number, isWater: boolean = false) {
    this.blastWaves.push({
      x,
      y,
      currentRadius: 6,
      maxRadius: radius,
      color: isWater ? '#38BDF8' : '#F59E0B',
      alpha: 1.0,
      isWater
    });

    const scale = Math.max(0.75, Math.min(2.2, radius / 44));
    const particleCount = Math.round((isWater ? 34 : 42) * scale);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * (isWater ? 280 : 230) + 55) * scale;
      const color = isWater
        ? (Math.random() > 0.5 ? '#E0F2FE' : '#38BDF8')
        : (Math.random() > 0.6 ? '#EF4444' : (Math.random() > 0.3 ? '#F59E0B' : '#78350F'));

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isWater ? 120 : 40),
        radius: (Math.random() * 5 + 2.5) * Math.min(1.8, scale),
        color,
        alpha: 1.0,
        life: 0,
        maxLife: (Math.random() * 0.55 + 0.45) * Math.min(1.5, scale)
      });
    }
  }

  public addDamageNumber(x: number, y: number, damage: number) {
    this.damageNumbers.push({
      x,
      y: y - 20,
      value: Math.max(0, Math.round(damage)),
      alpha: 1.0,
      // Stronger hits use red; lighter hits stay bright gold for quick reading.
      color: damage >= 60 ? '#FF3030' : damage >= 25 ? '#FF8A00' : '#FFE45E',
      life: 0
    });
  }

  public update(dt: number) {
    for (let i = this.blastWaves.length - 1; i >= 0; i--) {
      const bw = this.blastWaves[i];
      bw.currentRadius += (bw.maxRadius - bw.currentRadius) * 12 * dt;
      bw.alpha -= dt * 2.2;
      if (bw.alpha <= 0) this.blastWaves.splice(i, 1);
    }

    const gravity = 400;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) this.particles.splice(i, 1);
    }

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life += dt;
      dn.y -= dt * 45;
      dn.alpha = Math.max(0, 1 - dn.life / 0.9);
      if (dn.life >= 0.9) this.damageNumbers.splice(i, 1);
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const bw of this.blastWaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, bw.alpha);
      ctx.lineWidth = bw.isWater ? 4 : 3;
      ctx.strokeStyle = bw.color;
      ctx.beginPath();
      ctx.arc(bw.x, bw.y, bw.currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      if (bw.isWater) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(bw.x, bw.y, bw.currentRadius * 0.8, Math.PI, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const dn of this.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, dn.alpha);
      ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = dn.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = dn.color;
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4;
      const label = `-${dn.value} HP`;
      ctx.strokeText(label, dn.x, dn.y);
      ctx.fillText(label, dn.x, dn.y);
      ctx.restore();
    }
  }
}
