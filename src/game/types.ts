import { CharacterId, PowerUpType } from '../types/game';

export interface Vector2D {
  x: number;
  y: number;
}

export type BlockType = 'rock_earth_moss';

export interface TerrainBlock {
  id: string;
  islandIndex: 1 | 2; // 1 = Left island, 2 = Right island
  col: number;
  heightLevel: number; // 1 is bottom, 5 is top
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  hasMoss: boolean; // Top blocks have lush green moss
}

export type SceneryType = 'palm' | 'crate' | 'hut' | 'rock';

export interface SceneryObject {
  id: string;
  type: SceneryType;
  islandIndex: 1 | 2;
  x: number;
  y: number;
  width: number;
  height: number;
  supportedByBlockId: string;
  isDestroyed: boolean;
}

export interface SupplyCrate {
  id: string;
  islandIndex: 1 | 2;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  hasLanded: boolean;
  vy: number;
}

export type PlayerLifeState = 'active' | 'dying' | 'respawning' | 'invulnerable';

export interface PlayerEntity {
  id: string;
  role: 'player1' | 'player2';
  name: string;
  characterId: CharacterId;
  x: number;
  y: number;
  previousX?: number;
  previousY?: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  angle: number; // cannon angle in degrees (e.g. 10 - 80)
  power: number; // 10 - 100
  tiltAngle: number; // chassis tilt based on terrain slope
  wheelRotation: number;
  idleTimer: number;
  recoilOffset: number;
  isGrounded: boolean;
  onSafetyFloor: boolean;
  safetyTimer: number;
  hp: number;
  maxHp: number;
  lives: number;
  maxLives: number;
  lifeState: PlayerLifeState;
  stateTimer: number; // used for fade out/fade in / invulnerability
  alpha: number;
  score: number;
  // Combat Power-Up buffs
  hasShield: boolean;
  precisionActive: boolean;
  agilityActive: boolean;
  heldPowerUp: PowerUpType | null;
}

export interface ProjectileEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  launchDirection: 1 | -1;
  radius: number;
  mass: number; // 0.7 (light) to 1.6 (heavy)
  power: number;
  damage: number;
  explosionRadius: number;
  shooterRole: 'player1' | 'player2';
  isAlive: boolean;
  canBounce?: boolean;
  hasBounced?: boolean;
  isDoubleImpact?: boolean;
  isFireShot?: boolean;
  trail: { x: number; y: number; alpha: number; size: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface BlastWave {
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  isWater: boolean;
}

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  alpha: number;
  color: string;
  life: number;
}
