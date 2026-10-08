import { ProjectileEntity } from './types';
import { WorldConfig } from './world';

export interface FireShotParams {
  shooterRole: 'player1' | 'player2';
  originX: number;
  originY: number;
  angleDeg: number;
  powerPercent: number; // 10 to 100
  facing: 1 | -1;
  mass?: number; // 0.8 light, 1.0 standard, 1.5 heavy
  damageMultiplier?: number;
  explosionRadiusMultiplier?: number;
  canBounce?: boolean;
  isDoubleImpact?: boolean;
  isFireShot?: boolean;
}

export class ProjectileManager {
  public activeProjectile: ProjectileEntity | null = null;

  public fireShot(params: FireShotParams): ProjectileEntity {
    const { 
      shooterRole, 
      originX, 
      originY, 
      angleDeg, 
      powerPercent, 
      facing, 
      mass = 1.0,
      damageMultiplier = 1.0,
      explosionRadiusMultiplier = 1.0,
      canBounce = false,
      isDoubleImpact = false,
      isFireShot = false
    } = params;

    const angleRad = (angleDeg * Math.PI) / 180;
    // Base speed proportional to power, divided by square root of mass (heavier = shorter range)
    const normalizedPower = powerPercent / 100;
    const initialSpeed = ((WorldConfig.BASE_PROJECTILE_SPEED * 0.4) + (WorldConfig.BASE_PROJECTILE_SPEED * 0.85 * normalizedPower)) / Math.sqrt(mass);

    const vx = Math.cos(angleRad) * initialSpeed * facing;
    const vy = -Math.sin(angleRad) * initialSpeed;

    const projectile: ProjectileEntity = {
      id: `proj_${Date.now()}`,
      x: originX + facing * 28,
      y: originY - 18,
      vx,
      vy,
      launchDirection: facing,
      radius: Math.round(5 * mass),
      mass,
      power: powerPercent,
      damage: Math.round(28 * mass * damageMultiplier),
      explosionRadius: Math.round(44 * Math.sqrt(mass) * explosionRadiusMultiplier),
      shooterRole,
      isAlive: true,
      canBounce,
      hasBounced: false,
      isDoubleImpact,
      isFireShot,
      trail: []
    };

    this.activeProjectile = projectile;
    return projectile;
  }

  public update(dt: number, windDirection: -1 | 1, windSpeed: number) {
    if (!this.activeProjectile || !this.activeProjectile.isAlive) return;

    const p = this.activeProjectile;

    // Wind Force: lighter projectiles affected more, heavier projectiles affected less
    // windForce = (windSpeed * direction * factor) / mass
    const windAcceleration = (windSpeed * 6 * windDirection) / p.mass;
    const horizontalDirection = p.launchDirection;

    p.vx += windAcceleration * dt;
    p.vy += WorldConfig.GRAVITY * dt;

    // El viento solo puede frenar o acelerar la velocidad horizontal.
    // Nunca debe invertir el sentido del proyectil y hacerlo regresar al jugador.
    if (p.vx !== 0 && Math.sign(p.vx) !== horizontalDirection) {
      p.vx = 0;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Record smoke & fire trail
    p.trail.unshift({
      x: p.x,
      y: p.y,
      alpha: 1.0,
      size: p.radius * 0.85
    });

    if (p.trail.length > 28) {
      p.trail.pop();
    }

    for (let i = 0; i < p.trail.length; i++) {
      p.trail[i].alpha *= 0.93;
      p.trail[i].size *= 0.97;
    }

    // Check bounds
    if (
      p.x < -200 ||
      p.x > WorldConfig.WORLD_WIDTH + 200 ||
      p.y > WorldConfig.WORLD_HEIGHT + 200
    ) {
      p.isAlive = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.activeProjectile || !this.activeProjectile.isAlive) return;
    const p = this.activeProjectile;

    // 1. Render Smoke Trail
    for (let i = 0; i < p.trail.length; i++) {
      const pt = p.trail[i];
      ctx.fillStyle = `rgba(226, 232, 240, ${pt.alpha * 0.65})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size + (1 - pt.alpha) * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Projectile Core
    ctx.save();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer molten brass ring
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing spark
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(p.x - p.vx * 0.01, p.y - p.vy * 0.01, p.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public calculateAimGuide(
    originX: number,
    originY: number,
    angleDeg: number,
    powerPercent: number,
    facing: 1 | -1,
    windDirection: -1 | 1,
    windSpeed: number,
    mass: number = 1.0,
    extendedSteps: boolean = false
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const angleRad = (angleDeg * Math.PI) / 180;
    const normalizedPower = powerPercent / 100;
    const initialSpeed = ((WorldConfig.BASE_PROJECTILE_SPEED * 0.4) + (WorldConfig.BASE_PROJECTILE_SPEED * 0.85 * normalizedPower)) / Math.sqrt(mass);

    let vx = Math.cos(angleRad) * initialSpeed * facing;
    let vy = -Math.sin(angleRad) * initialSpeed;

    let simX = originX + facing * 28;
    let simY = originY - 18;
    points.push({ x: simX, y: simY });

    const dt = 0.04;
    const windAcceleration = (windSpeed * 18 * windDirection) / mass;
    const horizontalDirection = Math.sign(vx) || facing;
    // La guía sigue toda la parábola hasta el nivel del mar.
    // No se corta artificialmente a mitad del vuelo.
    const totalSteps = extendedSteps ? 48 : 40;

    for (let step = 0; step < totalSteps; step++) {
      vx += windAcceleration * dt;
      vy += WorldConfig.GRAVITY * dt;
      if (vx !== 0 && Math.sign(vx) !== horizontalDirection) {
        vx = 0;
      }
      simX += vx * dt;
      simY += vy * dt;
      points.push({ x: simX, y: simY });
      if (simY > WorldConfig.WATER_Y) break;
    }

    return points;
  }
}
