import { PlayerEntity, PlayerLifeState } from './types';
import { CharacterId } from '../types/game';
import { WorldConfig } from './world';
import { CollisionSystem } from './collision';
import { TerrainManager } from './terrain';
import { getCharacterById } from '../config/characters';

export class PlayerManager {
  public players: PlayerEntity[] = [];

  constructor(
    p1Name: string,
    p1Char: CharacterId,
    p2Name: string,
    p2Char: CharacterId,
    terrain: TerrainManager,
    maxLives: number = 3
  ) {
    this.createPlayers(p1Name, p1Char, p2Name, p2Char, terrain, maxLives);
  }

  public createPlayers(
    p1Name: string,
    p1Char: CharacterId,
    p2Name: string,
    p2Char: CharacterId,
    terrain: TerrainManager,
    maxLives: number
  ) {
    const p1Spawn = terrain.getSpawnPosition(1);
    const p2Spawn = terrain.getSpawnPosition(2);

    const p1CharConfig = getCharacterById(p1Char);
    const p2CharConfig = getCharacterById(p2Char);

    const player1: PlayerEntity = {
      id: 'p1',
      role: 'player1',
      name: p1Name || 'Comandante 1',
      characterId: p1Char,
      x: p1Spawn.x,
      y: p1Spawn.y,
      vx: 0,
      vy: 0,
      width: 48,
      height: 32,
      facing: 1,
      angle: Math.round((p1CharConfig.minAngle + p1CharConfig.maxAngle) / 2),
      power: 60,
      tiltAngle: 0,
      wheelRotation: 0,
      idleTimer: 0,
      recoilOffset: 0,
      isGrounded: true,
      onSafetyFloor: false,
      safetyTimer: 0,
      hp: 100,
      maxHp: 100,
      lives: maxLives,
      maxLives,
      lifeState: 'active',
      stateTimer: 0,
      alpha: 1.0,
      score: 0,
      hasShield: false,
      precisionActive: false,
      agilityActive: false,
      heldPowerUp: null
    };

    const player2: PlayerEntity = {
      id: 'p2',
      role: 'player2',
      name: p2Name || 'Comandante 2',
      characterId: p2Char,
      x: p2Spawn.x,
      y: p2Spawn.y,
      vx: 0,
      vy: 0,
      width: 48,
      height: 32,
      facing: -1,
      angle: Math.round((p2CharConfig.minAngle + p2CharConfig.maxAngle) / 2),
      power: 60,
      tiltAngle: 0,
      wheelRotation: 0,
      idleTimer: 0,
      recoilOffset: 0,
      isGrounded: true,
      onSafetyFloor: false,
      safetyTimer: 0,
      hp: 100,
      maxHp: 100,
      lives: maxLives,
      maxLives,
      lifeState: 'active',
      stateTimer: 0,
      alpha: 1.0,
      score: 0,
      hasShield: false,
      precisionActive: false,
      agilityActive: false,
      heldPowerUp: null
    };

    this.players = [player1, player2];
  }

  public getPlayer(role: 'player1' | 'player2'): PlayerEntity {
    return this.players.find(p => p.role === role)!;
  }

  /**
   * Set aim angle strictly within the selected character's limits
   */
  public setAimAngle(role: 'player1' | 'player2', targetAngle: number) {
    const player = this.getPlayer(role);
    const char = getCharacterById(player.characterId);
    player.angle = Math.max(char.minAngle, Math.min(char.maxAngle, targetAngle));
  }

  /**
   * Move player horizontally with touch/mouse direction or delta
   */
  public movePlayer(role: 'player1' | 'player2', deltaX: number, terrain: TerrainManager) {
    const player = this.getPlayer(role);
    if (player.lifeState !== 'active') return;

    const baseSpeed = 120; // px/s
    const speed = player.agilityActive ? baseSpeed * 1.6 : baseSpeed;
    const targetX = player.x + Math.sign(deltaX) * Math.min(Math.abs(deltaX), speed * 0.05);

    // Island bounds constraints
    const minX = player.role === 'player1' 
      ? WorldConfig.LEFT_ISLAND_START_COL * WorldConfig.BLOCK_WIDTH 
      : WorldConfig.RIGHT_ISLAND_START_COL * WorldConfig.BLOCK_WIDTH;
    const maxX = player.role === 'player1' 
      ? (WorldConfig.LEFT_ISLAND_END_COL + 1) * WorldConfig.BLOCK_WIDTH 
      : (WorldConfig.RIGHT_ISLAND_END_COL + 1) * WorldConfig.BLOCK_WIDTH;

    const clampedX = Math.max(minX, Math.min(maxX, targetX));

    // Check if player can step without hitting a sheer vertical obstacle
    if (CollisionSystem.canPlayerMoveTo(player.x, player.y, clampedX, terrain.blocks)) {
      const movedDistance = clampedX - player.x;
      player.x = clampedX;
      // Wheel rotation proportional to movement
      player.wheelRotation += movedDistance * 0.12;
      // Face movement direction
      if (Math.abs(movedDistance) > 0.1) {
        player.facing = movedDistance > 0 ? 1 : -1;
      }
    }
  }

  /**
   * Update physics, falling, safety floor countdown, and respawn cycle
   */
  public update(dt: number, terrain: TerrainManager, onPlayerDied?: (player: PlayerEntity) => void) {
    for (const player of this.players) {
      // 1. Idle vibration timer & recoil decay
      player.idleTimer += dt;
      if (player.recoilOffset > 0) {
        player.recoilOffset = Math.max(0, player.recoilOffset - dt * 60);
      }

      // 2. Handle Respawn State Machine
      if (player.lifeState === 'dying') {
        player.alpha = Math.max(0, player.alpha - dt * 1.5);
        player.stateTimer -= dt;
        if (player.stateTimer <= 0) {
          // Transition to respawning
          player.lifeState = 'respawning';
          player.stateTimer = 1.2; // 1.2s delay before appearance
        }
        continue;
      } else if (player.lifeState === 'respawning') {
        player.stateTimer -= dt;
        if (player.stateTimer <= 0) {
          // Spawn player back at top spawn position
          const islandIdx = player.role === 'player1' ? 1 : 2;
          const spawn = terrain.getSpawnPosition(islandIdx);
          player.x = spawn.x;
          player.y = spawn.y;
          player.vx = 0;
          player.vy = 0;
          player.hp = player.maxHp;
          player.lifeState = 'invulnerable';
          player.stateTimer = 2.0; // 2 seconds of invulnerability
          player.alpha = 1.0;
        }
        continue;
      } else if (player.lifeState === 'invulnerable') {
        player.stateTimer -= dt;
        if (player.stateTimer <= 0) {
          player.lifeState = 'active';
        }
      }

      // 3. Falling & Ground Support Physics
      const groundY = terrain.getGroundYAt(player.x);

      if (player.y < groundY - 1) {
        // Falling down under gravity
        player.vy += WorldConfig.GRAVITY * dt;
        player.y += player.vy * dt;
        player.isGrounded = false;

        // Land on ground
        if (player.y >= groundY) {
          player.y = groundY;
          player.vy = 0;
          player.isGrounded = true;
        }
      } else {
        // Grounded: match ground contour
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
      }

      // 4. Calculate terrain slope tilt
      player.tiltAngle = CollisionSystem.calculateGroundTilt(player.x, (wx) => terrain.getGroundYAt(wx));

      // 5. Check Safety Floor & Water Hazards
      // If player is on the submerged safety floor
      if (player.y >= WorldConfig.SAFETY_FLOOR_Y - 4 && player.y < WorldConfig.DEATH_FLOOR_Y) {
        player.onSafetyFloor = true;
        player.safetyTimer += dt;

        // Player can stay on safety floor briefly (~3.5 seconds) before drowning
        if (player.safetyTimer >= 3.5) {
          this.triggerPlayerDeath(player, onPlayerDied);
        }
      } else {
        player.onSafetyFloor = false;
        player.safetyTimer = 0;
      }

      // If player fell beyond death floor
      if (player.y >= WorldConfig.DEATH_FLOOR_Y) {
        this.triggerPlayerDeath(player, onPlayerDied);
      }
    }
  }

  /**
   * Trigger player life loss and initiate respawn sequence
   */
  public triggerPlayerDeath(player: PlayerEntity, onPlayerDied?: (player: PlayerEntity) => void) {
    if (player.lifeState === 'dying' || player.lifeState === 'respawning') return;

    player.lives -= 1;
    player.lifeState = 'dying';
    player.stateTimer = 0.8; // fade out duration

    if (onPlayerDied) {
      onPlayerDied(player);
    }
  }

  public applyDamage(player: PlayerEntity, damage: number, onPlayerDied?: (player: PlayerEntity) => void): number {
    if (player.lifeState !== 'active') return 0;

    let finalDamage = damage;
    if (player.hasShield) {
      finalDamage = Math.round(damage * 0.5); // 50% damage reduction from shield
      player.hasShield = false; // Consumed after blocking
    }

    player.hp = Math.max(0, player.hp - finalDamage);
    if (player.hp <= 0) {
      this.triggerPlayerDeath(player, onPlayerDied);
    }
    return finalDamage;
  }
}
