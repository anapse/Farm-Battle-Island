import { ProjectileEntity } from './types';
import { spriteManager } from './spriteManager';
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
  spriteId?: 'single_missile' | 'double_missile' | 'triple_missile' | 'explosive_missile' | 'grenade';
}

export class ProjectileManager {
  public activeProjectile: ProjectileEntity | null = null;
  public activeProjectiles: ProjectileEntity[] = [];

  public fireShot(params: FireShotParams): ProjectileEntity {
    const projectile = this.createProjectile(params);
    this.activeProjectiles = [projectile];
    this.activeProjectile = projectile;
    return projectile;
  }

  /**
   * Fire 2 or 3 independent projectiles. They share the same target area
   * but have a tiny angle spread, so each projectile can independently hit
   * or miss while using its own official sprite.
   */
  public fireMultiShot(params: FireShotParams, count: 2 | 3): ProjectileEntity[] {
    const spriteId = count === 3 ? 'triple_missile' : 'double_missile';
    const offsets = count === 3 ? [-2.2, 0, 2.2] : [-2, 2];
    const projectiles = offsets.map((offset, index) =>
      this.createProjectile({
        ...params,
        angleDeg: params.angleDeg + offset,
        spriteId,
        mass: params.mass ?? 1,
        powerPercent: params.powerPercent
      }, index)
    );
    this.activeProjectiles = projectiles;
    this.activeProjectile = projectiles[0] || null;
    return projectiles;
  }

  private createProjectile(params: FireShotParams, index = 0): ProjectileEntity {
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
      isFireShot = false,
      spriteId = 'single_missile'
    } = params;

    const angleRad = (angleDeg * Math.PI) / 180;
    const normalizedPower = powerPercent / 100;
    const initialSpeed =
      ((WorldConfig.BASE_PROJECTILE_SPEED * 0.4) +
        (WorldConfig.BASE_PROJECTILE_SPEED * 0.85 * normalizedPower)) /
      Math.sqrt(mass);

    const vx = Math.cos(angleRad) * initialSpeed * facing;
    const vy = -Math.sin(angleRad) * initialSpeed;
    const spread = index === 0 ? 0 : (index % 2 === 0 ? 5 : -5);

    return {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      x: originX + facing * 28 + spread,
      y: originY - 18,
      previousX: originX + facing * 28 + spread,
      previousY: originY - 18,
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
      spriteId,
      grenadeRolling: false,
      grenadeRollTime: 0,
      grenadeBounceTimer: 0,
      rotation: 0,
      trail: []
    };
  }

  public update(dt: number, windDirection: -1 | 1, windSpeed: number, getGroundYAt?: (x: number) => number) {
    if (this.activeProjectiles.length === 0) return;

    for (const p of this.activeProjectiles) {
      if (!p.isAlive) continue;

      const windAcceleration = (windSpeed * 6 * windDirection) / p.mass;
      const horizontalDirection = p.launchDirection;

      p.previousX = p.x;
      p.previousY = p.y;

      if (p.spriteId === 'grenade' && (p.grenadeBounceTimer ?? 0) > 0) {
        // Small physical bounce after first contact.
        p.grenadeBounceTimer = Math.max(0, (p.grenadeBounceTimer ?? 0) - dt);
        p.vx += windAcceleration * dt;
        p.vy += WorldConfig.GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation = (p.rotation ?? 0) + (p.vx * dt) / Math.max(1, p.radius);

        if ((p.grenadeBounceTimer ?? 0) <= 0 && getGroundYAt) {
          p.grenadeRolling = true;
          p.grenadeRollTime = 0;
          p.vy = 0;
          p.y = getGroundYAt(p.x) - p.radius - 1;
        }
      } else if (p.grenadeRolling && getGroundYAt) {
        // Grenade stays on the terrain instead of falling through it.
        const groundY = getGroundYAt(p.x);
        p.grenadeRollTime = (p.grenadeRollTime ?? 0) + dt;
        p.vy = 0;
        p.vx += windAcceleration * 0.15 * dt;
        p.vx *= Math.max(0, 1 - 1.15 * dt);
        p.x += p.vx * dt;
        p.y = groundY - p.radius - 1;
        p.rotation = (p.rotation ?? 0) + p.vx * dt / Math.max(1, p.radius);

        if (Math.abs(p.vx) < 18 || (p.grenadeRollTime ?? 0) >= 2.8) {
          p.vx = 0;
        }
      } else {
        p.vx += windAcceleration * dt;
        p.vy += WorldConfig.GRAVITY * dt;

        if (p.vx !== 0 && Math.sign(p.vx) !== horizontalDirection) {
          p.vx = 0;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation = (p.rotation ?? 0) + (p.vx * dt) / Math.max(1, p.radius);
      }

      p.trail.unshift({
        x: p.x,
        y: p.y,
        alpha: 1.0,
        size: p.radius * 0.85
      });

      if (p.trail.length > 28) p.trail.pop();

      for (const point of p.trail) {
        point.alpha *= 0.93;
        point.size *= 0.97;
      }

      if (
        p.x < -120 ||
        p.x > WorldConfig.WORLD_WIDTH + 120 ||
        p.y > WorldConfig.WORLD_HEIGHT + 80 ||
        p.y < -240
      ) {
        p.isAlive = false;
      }
    }

    const alive = this.activeProjectiles.filter(p => p.isAlive);
    if (alive.length === 0) {
      this.activeProjectile = null;
    } else {
      this.activeProjectile = alive[0];
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.activeProjectiles) {
      if (!p.isAlive) continue;

      for (const pt of p.trail) {
        ctx.fillStyle = `rgba(226, 232, 240, ${pt.alpha * 0.65})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size + (1 - pt.alpha) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      const sprite = p.spriteId
        ? spriteManager.getCombatIcon(p.spriteId)
        : null;

      if (sprite) {
        const size = (p.spriteId === 'grenade' ? 100 : 86) * 1.5;
        const angle = p.grenadeRolling ? (p.rotation ?? 0) : Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(p.x - p.vx * 0.01, p.y - p.vy * 0.01, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
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
