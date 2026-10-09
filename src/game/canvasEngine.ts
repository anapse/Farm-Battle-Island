import { CharacterId } from '../types/game';
import { GameEngine, GameEngineOptions } from './engine';
import { WindEngineState } from './world';

export interface CanvasEngineOptions {
  islandId: string;
  player1Name?: string;
  player1CharacterId: string;
  player2Name?: string;
  player2CharacterId: string;
  player1Angle: number;
  player1Power: number;
  player2Angle: number;
  player2Power: number;
  currentTurn: 'player1' | 'player2';
  windSpeed: number;
  windDirection: -1 | 1;
  maxLives?: number;
  onTurnComplete?: () => void;
  onHit?: (target: 'player1' | 'player2', damage: number) => void;
  onPlayerDied?: (target: 'player1' | 'player2') => void;
  onAngleChange?: (angle: number) => void;
  onSupplyCrateCollected?: (collector: 'player1' | 'player2') => void;
  onStorkEvent?: () => void;
}

export class GameCanvasEngine {
  private engine: GameEngine;

  public currentTurn: 'player1' | 'player2';

  constructor(canvas: HTMLCanvasElement, options: CanvasEngineOptions) {
    this.currentTurn = options.currentTurn;

    const wind: WindEngineState = {
      direction: options.windDirection,
      speed: options.windSpeed,
      angleDeg: 35
    };

    const engineOptions: GameEngineOptions = {
      canvas,
      islandId: options.islandId,
      p1Name: options.player1Name || 'Comandante 1',
      p1CharacterId: (options.player1CharacterId || 'mono') as CharacterId,
      p2Name: options.player2Name || 'Comandante 2',
      p2CharacterId: (options.player2CharacterId || 'tortuga') as CharacterId,
      initialTurn: options.currentTurn,
      wind,
      maxLives: options.maxLives || 3,
      onTurnComplete: options.onTurnComplete,
      onPlayerHit: options.onHit,
      onPlayerDied: options.onPlayerDied,
      onAngleChange: options.onAngleChange,
      onSupplyCrateCollected: options.onSupplyCrateCollected,
      onStorkEvent: options.onStorkEvent
    };

    this.engine = new GameEngine(engineOptions);
    this.engine.setPlayerAngle('player1', options.player1Angle);
    this.engine.setPlayerPower('player1', options.player1Power);
    this.engine.setPlayerAngle('player2', options.player2Angle);
    this.engine.setPlayerPower('player2', options.player2Power);
  }

  public updateConfig(options: Partial<CanvasEngineOptions>) {
    if (options.player1Angle !== undefined) {
      this.engine.setPlayerAngle('player1', options.player1Angle);
    }
    if (options.player1Power !== undefined) {
      this.engine.setPlayerPower('player1', options.player1Power);
    }
    if (options.player2Angle !== undefined) {
      this.engine.setPlayerAngle('player2', options.player2Angle);
    }
    if (options.player2Power !== undefined) {
      this.engine.setPlayerPower('player2', options.player2Power);
    }
    if (options.currentTurn !== undefined) {
      this.currentTurn = options.currentTurn;
      this.engine.setTurn(options.currentTurn);
    }
    if (options.windSpeed !== undefined || options.windDirection !== undefined) {
      this.engine.setWind({
        speed: options.windSpeed !== undefined ? options.windSpeed : this.engine.wind.speed,
        direction: options.windDirection !== undefined ? options.windDirection : this.engine.wind.direction,
        angleDeg: 35
      });
    }
  }

  public focusPlayer(player: 'player1' | 'player2') {
    this.engine.focusPlayer(player);
  }

  public focusCenter() {
    this.engine.focusCenter();
  }

  public fireShot(shooter: 'player1' | 'player2', powerUpType?: any) {
    this.engine.setTurn(shooter);
    this.engine.executeFireSequence(powerUpType);
  }

  public applyPowerUp(role: 'player1' | 'player2', powerUp: string): { newHp?: number } {
    const player = this.engine.players.getPlayer(role);
    if (!player) return {};

    if (powerUp === 'heal_10') {
      player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.10));
      return { newHp: player.hp };
    } else if (powerUp === 'heal_20') {
      player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.20));
      return { newHp: player.hp };
    } else if (powerUp === 'shield') {
      player.hasShield = true;
    } else if (powerUp === 'precision') {
      player.precisionActive = true;
    } else if (powerUp === 'agility') {
      player.agilityActive = true;
    }

    return {};
  }

  public movePlayer(role: 'player1' | 'player2', deltaX: number) {
    this.engine.players.movePlayer(role, deltaX, this.engine.terrain);
  }

  public resize(width: number, height: number) {
    this.engine.resize(width, height);
  }

  public destroy() {
    this.engine.destroy();
  }

  // Check if cannon is currently executing a fire sequence or projectile is alive
  public isFiring(): boolean {
    return this.engine.isFiringSequence || (this.engine.projectiles.activeProjectile !== null && this.engine.projectiles.activeProjectile.isAlive);
  }

  // Getter to access underlying engine if needed
  public getEngine(): GameEngine {
    return this.engine;
  }
}
