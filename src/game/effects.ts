import { Particle, BlastWave, DamageNumber } from './types';

export class EffectManager {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioContext) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtor) return null;
        this.audioContext = new AudioCtor();
      }
      if (this.audioContext.state === 'suspended') void this.audioContext.resume();
      return this.audioContext;
    } catch {
      return null;
    }
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
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
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
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playGrenadeExplosion() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.34);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.44);
  }

  public particles: Particle[] = [];
  public blastWaves: BlastWave[] = [];
  public damageNumbers: DamageNumber[] = [];

  public createExplosion(x: number, y: number, radius: number, isWater: boolean = false) {
    // 1. Expanding shockwave ring
    this.blastWaves.push({
      x,
      y,
      currentRadius: 6,
      maxRadius: radius,
      color: isWater ? '#38BDF8' : '#F59E0B',
      alpha: 1.0,
      isWater
    });

    // 2. Mathematical particle spark cloud (no AI sprites)
    const particleCount = isWater ? 30 : 25;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isWater ? 240 : 180) + 40;
      const color = isWater 
        ? (Math.random() > 0.5 ? '#E0F2FE' : '#38BDF8')
        : (Math.random() > 0.6 ? '#EF4444' : (Math.random() > 0.3 ? '#F59E0B' : '#78350F'));

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isWater ? 120 : 40), // water splashes upwards
        radius: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 0.5 + 0.4
      });
    }
  }

  public addDamageNumber(x: number, y: number, damage: number) {
    this.damageNumbers.push({
      x,
      y: y - 20,
      value: damage,
      alpha: 1.0,
      color: damage > 25 ? '#EF4444' : '#F59E0B',
      life: 0
    });
  }

  public update(dt: number) {
    // 1. Update blast waves
    for (let i = this.blastWaves.length - 1; i >= 0; i--) {
      const bw = this.blastWaves[i];
      bw.currentRadius += (bw.maxRadius - bw.currentRadius) * 12 * dt;
      bw.alpha -= dt * 2.2;
      if (bw.alpha <= 0) {
        this.blastWaves.splice(i, 1);
      }
    }

    // 2. Update particles
    const gravity = 400;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life += dt;
      dn.y -= dt * 45; // float upwards
      dn.alpha = Math.max(0, 1 - dn.life / 0.9);

      if (dn.life >= 0.9) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Render Shockwave Rings
    for (const bw of this.blastWaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, bw.alpha);
      ctx.lineWidth = bw.isWater ? 4 : 3;
      ctx.strokeStyle = bw.color;
      ctx.beginPath();
      ctx.arc(bw.x, bw.y, bw.currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      if (bw.isWater) {
        // Water splash dome
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(bw.x, bw.y, bw.currentRadius * 0.8, Math.PI, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Render Mathematical Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Damage Numbers
    for (const dn of this.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, dn.alpha);
      ctx.font = 'black 16px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = dn.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`-${dn.value}`, dn.x, dn.y);
      ctx.fillText(`-${dn.value}`, dn.x, dn.y);
      ctx.restore();
    }
  }
}
