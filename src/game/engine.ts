import { WorldConfig, WindEngineState } from './world';
import { CameraController } from './camera';
import { TerrainManager } from './terrain';
import { PlayerManager } from './players';
import { ProjectileManager } from './projectiles';
import { EffectManager } from './effects';
import { CollisionSystem } from './collision';
import { InputHandler } from './input';
import { VehicleRenderer } from './vehicles';
import { CharacterId, PowerUpType } from '../types/game';
import { SupplyCrate } from './types';
import { spriteManager } from './spriteManager';

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  islandId: string;
  p1Name: string;
  p1CharacterId: CharacterId;
  p2Name: string;
  p2CharacterId: CharacterId;
  initialTurn: 'player1' | 'player2';
  wind: WindEngineState;
  maxLives: number;
  onTurnComplete?: () => void;
  onPlayerHit?: (target: 'player1' | 'player2', damage: number) => void;
  onPlayerDied?: (target: 'player1' | 'player2') => void;
  onAngleChange?: (angle: number) => void;
  onSupplyCrateCollected?: (collector: 'player1' | 'player2') => void;
  onStorkEvent?: () => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  public camera: CameraController;
  public terrain: TerrainManager;
  public players: PlayerManager;
  public projectiles: ProjectileManager;
  public effects: EffectManager;
  public input: InputHandler;

  public currentTurn: 'player1' | 'player2';
  public wind: WindEngineState;
  public isFiringSequence: boolean = false;
  public totalShotsCount: number = 0;
  public supplyCrates: SupplyCrate[] = [];
  public islandId: string;

  private waveOffset: number = 0;

  private onTurnComplete?: () => void;
  private onPlayerHit?: (target: 'player1' | 'player2', damage: number) => void;
  private onPlayerDied?: (target: 'player1' | 'player2') => void;
  private onAngleChange?: (angle: number) => void;
  private onSupplyCrateCollected?: (collector: 'player1' | 'player2') => void;
  private onStorkEvent?: () => void;

  constructor(options: GameEngineOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context from canvas');
    this.ctx = context;

    this.islandId = options.islandId;
    this.currentTurn = options.initialTurn;
    this.wind = options.wind;
    this.onTurnComplete = options.onTurnComplete;
    this.onPlayerHit = options.onPlayerHit;
    this.onPlayerDied = options.onPlayerDied;
    this.onAngleChange = options.onAngleChange;
    this.onSupplyCrateCollected = options.onSupplyCrateCollected;
    this.onStorkEvent = options.onStorkEvent;

    // 1. Initialize Subsystems
    this.camera = new CameraController(this.canvas.width, this.canvas.height);
    this.terrain = new TerrainManager(options.islandId);
    this.players = new PlayerManager(
      options.p1Name,
      options.p1CharacterId,
      options.p2Name,
      options.p2CharacterId,
      this.terrain,
      options.maxLives
    );
    this.projectiles = new ProjectileManager();
    this.effects = new EffectManager();

    this.input = new InputHandler({
      canvas: this.canvas,
      camera: this.camera,
      players: this.players,
      terrain: this.terrain,
      getCurrentTurn: () => this.currentTurn,
      onAngleDelta: (delta) => {
        const player = this.players.getPlayer(this.currentTurn);
        const newAngle = player.angle + delta;
        this.players.setAimAngle(this.currentTurn, newAngle);
        if (this.onAngleChange) this.onAngleChange(player.angle);
      },
      onFireRequest: () => {
        this.executeFireSequence();
      }
    });

    // Initial camera focus on starting player
    this.focusPlayer(this.currentTurn);
    this.camera.snapToTarget();

    // Start single unified game loop
    this.startLoop();
  }

  public focusPlayer(role: 'player1' | 'player2') {
    const player = this.players.getPlayer(role);
    this.camera.setMode(role);
    this.camera.setTarget(player.x, player.y - 40);
  }

  public focusCenter() {
    this.camera.setMode('center');
    this.camera.setTarget(WorldConfig.WORLD_WIDTH / 2, WorldConfig.WATER_Y - 120);
  }

  public setPlayerAngle(role: 'player1' | 'player2', angle: number) {
    this.players.setAimAngle(role, angle);
  }

  public setPlayerPower(role: 'player1' | 'player2', power: number) {
    const player = this.players.getPlayer(role);
    player.power = Math.max(10, Math.min(100, power));
  }

  public setWind(wind: WindEngineState) {
    this.wind = wind;
  }

  public setTurn(turn: 'player1' | 'player2') {
    if (this.currentTurn !== turn) {
      this.currentTurn = turn;
      if (!this.isFiringSequence) {
        this.focusPlayer(this.currentTurn);
      }
    }
  }

  /**
   * Complete 12-Step Fire Sequence requested in Etapa 2:
   * 1. Camera returns to player
   * 2. Calculate shot
   * 3. Launch projectile (recoil & muzzle flash)
   * 4. Camera follows projectile
   * 5. Parabolic flight
   * 6. Impact
   * 7. Explosion
   * 8. Damage to enemy
   * 9. Destroy affected blocks
   * 10. LEGO scenery objects check
   * 11. Camera focuses outcome
   * 12. Turn completes
   */
  public executeFireSequence(powerUpType?: PowerUpType | null) {
    if (this.isFiringSequence || (this.projectiles.activeProjectile && this.projectiles.activeProjectile.isAlive)) {
      return;
    }

    this.isFiringSequence = true;
    const shooter = this.players.getPlayer(this.currentTurn);

    // Track shots count and trigger Stork supply every 4 shots!
    this.totalShotsCount++;
    if (this.totalShotsCount % 4 === 0) {
      this.triggerStorkSupplyDrop();
    }

    // 1. Camera smoothly centers on player
    this.focusPlayer(this.currentTurn);

    // 2. Cannon recoil & muzzle flash particles
    shooter.recoilOffset = 14;
    this.effects.createExplosion(shooter.x + shooter.facing * 32, shooter.y - 18, 16, false);

    // Determine shot attributes based on power-up
    let mass = 1.0;
    let damageMultiplier = 1.0;
    let explosionRadiusMultiplier = 1.0;
    let canBounce = false;
    let isDoubleImpact = false;
    let isFireShot = false;

    if (powerUpType === 'mega_bomb') {
      mass = 1.8;
      explosionRadiusMultiplier = 1.6;
      damageMultiplier = 1.4;
    } else if (powerUpType === 'power_boost') {
      damageMultiplier = 1.35;
    } else if (powerUpType === 'fire_shot') {
      isFireShot = true;
      damageMultiplier = 1.25;
    } else if (powerUpType === 'double_hit') {
      isDoubleImpact = true;
      explosionRadiusMultiplier = 1.35;
    } else if (powerUpType === 'bounce') {
      canBounce = true;
    }

    // 3. Launch ballistic projectile
    this.projectiles.fireShot({
      shooterRole: this.currentTurn,
      originX: shooter.x,
      originY: shooter.y,
      angleDeg: shooter.angle,
      powerPercent: shooter.power,
      facing: shooter.facing,
      mass,
      damageMultiplier,
      explosionRadiusMultiplier,
      canBounce,
      isDoubleImpact,
      isFireShot
    });

    // 4. Camera tracks projectile
    this.camera.setMode('projectile');
  }

  public triggerStorkSupplyDrop() {
    const p1Spawn = this.terrain.getSpawnPosition(1);
    const p2Spawn = this.terrain.getSpawnPosition(2);

    this.supplyCrates = [
      {
        id: `crate_p1_${Date.now()}`,
        islandIndex: 1,
        x: p1Spawn.x + 36,
        y: 120,
        width: 28,
        height: 28,
        collected: false,
        hasLanded: false,
        vy: 65
      },
      {
        id: `crate_p2_${Date.now()}`,
        islandIndex: 2,
        x: p2Spawn.x - 36,
        y: 120,
        width: 28,
        height: 28,
        collected: false,
        hasLanded: false,
        vy: 65
      }
    ];

    if (this.onStorkEvent) {
      this.onStorkEvent();
    }
  }

  private handleProjectileImpact(hitX: number, hitY: number, isWater: boolean, hitTarget?: 'player1' | 'player2') {
    const proj = this.projectiles.activeProjectile;
    if (!proj) return;

    proj.isAlive = false;
    const explosionRadius = proj.explosionRadius;

    // 7. Visual explosion
    this.effects.createExplosion(hitX, hitY, explosionRadius, isWater);
    this.camera.addShake(isWater ? 8 : 15);

    // Double impact secondary wave
    if (proj.isDoubleImpact) {
      setTimeout(() => {
        this.effects.createExplosion(hitX + (Math.random() - 0.5) * 20, hitY, explosionRadius * 0.8, isWater);
      }, 160);
    }

    // 8. Damage enemy if in blast radius
    for (const player of this.players.players) {
      const dist = Math.hypot(player.x - hitX, (player.y - 14) - hitY);
      if (dist <= explosionRadius) {
        // Linear damage falloff from epicenter
        const damageFactor = Math.max(0.35, 1 - dist / explosionRadius);
        const rawDamage = Math.round(proj.damage * damageFactor);

        const actualDamage = this.players.applyDamage(player, rawDamage, (deadPlayer) => {
          if (this.onPlayerDied) {
            this.onPlayerDied(deadPlayer.role);
          }
        });

        this.effects.addDamageNumber(player.x, player.y - 10, actualDamage);

        if (this.onPlayerHit) {
          this.onPlayerHit(player.role, actualDamage);
        }
      }
    }

    // 9 & 10. Destroy modular terrain blocks and remove unsupported scenery (LEGO rule)
    if (!isWater) {
      this.terrain.explodeAt(hitX, hitY, explosionRadius);
    }

    // 11. Focus camera on impact site for 0.9s
    this.camera.setTarget(hitX, hitY);

    setTimeout(() => {
      this.projectiles.activeProjectile = null;
      this.isFiringSequence = false;

      // 12. Turn finishes
      if (this.onTurnComplete) {
        this.onTurnComplete();
      }
    }, 1100);
  }

  private startLoop() {
    const loop = (timestamp: number) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.08);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    this.waveOffset += dt * 2.8;

    // 1. Update Projectiles
    this.projectiles.update(dt, this.wind.direction, this.wind.speed);

    // 2. Check Projectile Collisions
    if (this.projectiles.activeProjectile && this.projectiles.activeProjectile.isAlive) {
      const p = this.projectiles.activeProjectile;

      // Camera follows projectile smoothly
      this.camera.setTarget(p.x, p.y);

      const collision = CollisionSystem.checkProjectileCollision(
        p,
        this.terrain.blocks,
        this.players.players
      );

      if (collision.hit) {
        if (collision.type === 'terrain' && p.canBounce && !p.hasBounced) {
          p.hasBounced = true;
          p.vy = -Math.abs(p.vy) * 0.6;
          p.vx = p.vx * 0.7;
          p.y = collision.hitY - p.radius - 2;
          this.effects.createExplosion(collision.hitX, collision.hitY, 14, false);
          this.camera.addShake(6);
        } else {
          this.handleProjectileImpact(
            collision.hitX,
            collision.hitY,
            collision.type === 'water',
            collision.hitPlayer?.role
          );
        }
      }
    }

    // 3. Update Falling & Grounded Supply Crates
    for (const crate of this.supplyCrates) {
      if (crate.collected) continue;

      if (!crate.hasLanded) {
        crate.y += crate.vy * dt;
        const groundY = this.terrain.getGroundYAt(crate.x);
        if (crate.y >= groundY - crate.height) {
          crate.y = groundY - crate.height;
          crate.hasLanded = true;
        }
      }

      // Check pickup collision with active player
      const activePlayer = this.players.getPlayer(this.currentTurn);
      if (activePlayer.lifeState === 'active') {
        const dist = Math.hypot(activePlayer.x - crate.x, (activePlayer.y - 14) - crate.y);
        if (dist <= 36) {
          crate.collected = true;
          this.effects.createExplosion(crate.x, crate.y, 24, false);
          if (this.onSupplyCrateCollected) {
            this.onSupplyCrateCollected(activePlayer.role);
          }
        }
      }
    }

    // 4. Update Players & Physics
    this.players.update(dt, this.terrain, (deadPlayer) => {
      if (this.onPlayerDied) {
        this.onPlayerDied(deadPlayer.role);
      }
    });

    // 4. Update Effects & Particles
    this.effects.update(dt);

    // 5. Update Camera
    if (!this.isFiringSequence && this.camera.followMode !== 'manual') {
      const activePlayer = this.players.getPlayer(this.currentTurn);
      this.camera.setTarget(activePlayer.x, activePlayer.y - 40);
    }
    this.camera.update(dt);
  }

  private render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera scale and translation
    this.camera.applyTransform(ctx);

    // 1. Render Sky Background
    this.renderSky();

    // 2. Distant Horizon, mountains & sunken ship
    this.renderHorizonAndShip();

    // 3. Modular Destructible Blocks & Scenery
    this.terrain.render(ctx);

    // 4. Animated Water Layer
    this.renderWater();

    // 4.5 Render Supply Crates (Stork Drop)
    this.renderSupplyCrates(ctx);

    // 5. Players & Vehicles
    for (const player of this.players.players) {
      VehicleRenderer.render(ctx, player, this.currentTurn === player.role && !this.isFiringSequence);
    }

    // 6. Aiming Trajectory Guide (for active player during their turn)
    if (!this.isFiringSequence && this.players.getPlayer(this.currentTurn).lifeState === 'active') {
      this.renderAimGuide();
    }

    // 7. Projectile
    this.projectiles.render(ctx);

    // 8. Explosion Particles & Shockwaves
    this.effects.render(ctx);

    ctx.restore();
  }

  private renderSky() {
    const ctx = this.ctx;

    // Check if official background 1, 2 or 3 is available
    const themeNum: 1 | 2 | 3 = this.islandId === 'island_3' ? 3 : (this.islandId === 'island_2' ? 2 : 1);
    const bgImage = spriteManager.getBackground(themeNum);

    if (bgImage) {
      // Draw official battlefield background
      ctx.drawImage(bgImage, 0, 0, WorldConfig.WORLD_WIDTH, WorldConfig.WATER_Y + 60);
      return;
    }

    // Procedural sky fallback
    const skyGrad = ctx.createLinearGradient(0, 0, 0, WorldConfig.WATER_Y);
    skyGrad.addColorStop(0, '#38BDF8');
    skyGrad.addColorStop(0.45, '#7DD3FC');
    skyGrad.addColorStop(0.85, '#BAE6FD');
    skyGrad.addColorStop(1, '#E0F2FE');

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WorldConfig.WORLD_WIDTH, WorldConfig.WATER_Y);

    // Gentle fluffy clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    this.drawCloud(220, 110, 80);
    this.drawCloud(680, 160, 110);
    this.drawCloud(1220, 90, 90);
    this.drawCloud(1750, 140, 100);
    this.drawCloud(2150, 110, 80);
  }

  private drawCloud(cx: number, cy: number, size: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.35, cy - size * 0.12, size * 0.48, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.75, cy, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderHorizonAndShip() {
    const themeNum: 1 | 2 | 3 = this.islandId === 'island_3' ? 3 : (this.islandId === 'island_2' ? 2 : 1);
    if (spriteManager.getBackground(themeNum)) {
      // Official background already has horizon, mountains and shipwreck!
      return;
    }

    const ctx = this.ctx;
    const waterY = WorldConfig.WATER_Y;

    // Distant mountain islands in turquoise haze
    ctx.fillStyle = '#6EE7B7';
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(420, waterY);
    ctx.quadraticCurveTo(620, waterY - 170, 820, waterY);
    ctx.moveTo(1350, waterY);
    ctx.quadraticCurveTo(1580, waterY - 210, 1820, waterY);
    ctx.fill();

    // Sunken pirate ship in center sea
    ctx.fillStyle = '#1E293B';
    ctx.globalAlpha = 0.38;
    const shipX = WorldConfig.WORLD_WIDTH / 2;
    const shipY = waterY - 30;

    ctx.beginPath();
    ctx.moveTo(shipX - 45, shipY);
    ctx.lineTo(shipX + 55, shipY - 18);
    ctx.lineTo(shipX + 35, shipY + 28);
    ctx.lineTo(shipX - 35, shipY + 28);
    ctx.closePath();
    ctx.fill();

    // Masts
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1E293B';
    ctx.beginPath();
    ctx.moveTo(shipX + 5, shipY - 10);
    ctx.lineTo(shipX + 22, shipY - 80);
    ctx.stroke();

    ctx.globalAlpha = 1.0;
  }

  private renderWater() {
    const ctx = this.ctx;
    const waterY = WorldConfig.WATER_Y;
    const waterHeight = WorldConfig.WORLD_HEIGHT - waterY;

    // Ocean deep gradient
    const oceanGrad = ctx.createLinearGradient(0, waterY, 0, WorldConfig.WORLD_HEIGHT);
    oceanGrad.addColorStop(0, '#0284C7');
    oceanGrad.addColorStop(0.35, '#0369A1');
    oceanGrad.addColorStop(1, '#0C4A6E');

    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, waterY, WorldConfig.WORLD_WIDTH, waterHeight);

    // Dynamic wave ripples on surface
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    for (let x = 0; x <= WorldConfig.WORLD_WIDTH; x += 35) {
      const y = waterY + Math.sin(x * 0.035 + this.waveOffset) * 4.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WorldConfig.WORLD_WIDTH, waterY + 12);
    ctx.lineTo(0, waterY + 12);
    ctx.closePath();
    ctx.fill();
  }

  private renderSupplyCrates(ctx: CanvasRenderingContext2D) {
    for (const crate of this.supplyCrates) {
      if (crate.collected) continue;

      ctx.save();

      // Check if official cofre.png sprites are available
      const parachuteChest = spriteManager.getChest('parachute');
      const openChest = spriteManager.getChest('open');

      if (!crate.hasLanded && parachuteChest) {
        // Draw official falling parachute chest
        const w = 48;
        const h = 58;
        ctx.drawImage(parachuteChest, crate.x - w / 2, crate.y - 20, w, h);
        ctx.restore();
        continue;
      } else if (crate.hasLanded && openChest) {
        // Draw official landed glowing treasure chest
        const w = 42;
        const h = 38;
        ctx.drawImage(openChest, crate.x - w / 2, crate.y - 12, w, h);
        ctx.restore();
        continue;
      }

      // Procedural fallback
      // Render Parachute if falling
      if (!crate.hasLanded) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(crate.x, crate.y - 18, 20, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(crate.x - 18, crate.y - 18);
        ctx.lineTo(crate.x - 8, crate.y);
        ctx.moveTo(crate.x + 18, crate.y - 18);
        ctx.lineTo(crate.x + 8, crate.y);
        ctx.stroke();
      }

      // Wooden Crate Box
      ctx.fillStyle = '#B45309';
      ctx.fillRect(crate.x - crate.width / 2, crate.y, crate.width, crate.height);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.strokeRect(crate.x - crate.width / 2, crate.y, crate.width, crate.height);

      // Golden Ribbon
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(crate.x - 3, crate.y, 6, crate.height);
      ctx.fillRect(crate.x - crate.width / 2, crate.y + crate.height / 2 - 3, crate.width, 6);

      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎁', crate.x, crate.y + crate.height / 2);

      ctx.restore();
    }
  }

  private renderAimGuide() {
    const ctx = this.ctx;
    const activePlayer = this.players.getPlayer(this.currentTurn);
    const facing = activePlayer.facing;

    const guidePoints = this.projectiles.calculateAimGuide(
      activePlayer.x,
      activePlayer.y,
      activePlayer.angle,
      activePlayer.power,
      facing,
      this.wind.direction,
      this.wind.speed,
      1.0,
      activePlayer.precisionActive
    );

    if (guidePoints.length < 2) return;

    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = activePlayer.role === 'player1' ? 'rgba(239, 68, 68, 0.75)' : 'rgba(59, 130, 246, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(guidePoints[0].x, guidePoints[0].y);

    for (let i = 1; i < guidePoints.length; i++) {
      ctx.lineTo(guidePoints[i].x, guidePoints[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.resize(width, height);
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.input.destroy();
  }
}
