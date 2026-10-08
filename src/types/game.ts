export type CharacterId = 'mono' | 'tortuga' | 'gallina' | 'panda' | 'conejo' | 'mapache';

export interface CharacterStats {
  id: CharacterId;
  name: string;
  fuerza: number;
  resistencia: number;
  minAngle: number;
  maxAngle: number;
  badgeSymbol: string;
  themeColor: string;
  accentColor: string;
  tankColor: string;
  barrelColor: string;
  specialTrait: string;
}

export type PowerUpType = 
  | 'heal_10'     // ❤️ Curación +10%
  | 'heal_20'     // ❤️❤️ Curación Rara +20%
  | 'mega_bomb'   // 💣 Mega Bomba
  | 'shield'      // 🛡 Escudo
  | 'precision'   // 🎯 Precisión
  | 'power_boost' // 💥 Potencia
  | 'agility'     // 🏃 Movimiento
  | 'fire_shot'   // 🔥 Disparo
  | 'double_hit'  // 💥💥 Doble Impacto
  | 'triple_hit'  // 💥💥💥 Triple Impacto
  | 'grenade'
  | 'bounce';     // ↩ Rebote

export interface PowerUpItem {
  id: PowerUpType;
  name: string;
  symbol: string;
  description: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic';
}

export const POWER_UP_LIST: PowerUpItem[] = [
  { id: 'heal_10', name: 'Curación', symbol: '❤️', description: '+10% de salud (máximo 100%)', color: '#EF4444', rarity: 'common' },
  { id: 'heal_20', name: 'Curación Rara', symbol: '❤️❤️', description: '+20% de salud (máximo 100%)', color: '#DC2626', rarity: 'rare' },
  { id: 'mega_bomb', name: 'Mega Bomba', symbol: '💣', description: 'Impacto destructivo pesado y mayor radio', color: '#64748B', rarity: 'rare' },
  { id: 'shield', name: 'Escudo', symbol: '🛡️', description: 'Reduce el próximo daño recibido en 50%', color: '#3B82F6', rarity: 'common' },
  { id: 'precision', name: 'Precisión', symbol: '🎯', description: 'Guía de trayectoria extendida y alta exactitud', color: '#10B981', rarity: 'common' },
  { id: 'power_boost', name: 'Potencia', symbol: '💥', description: '+30% velocidad inicial y daño de impacto', color: '#F59E0B', rarity: 'rare' },
  { id: 'agility', name: 'Movimiento', symbol: '🏃', description: '+50% distancia y agilidad de desplazamiento', color: '#8B5CF6', rarity: 'common' },
  { id: 'fire_shot', name: 'Disparo Fuego', symbol: '🔥', description: 'Proyectil incendiario con daño concentrado', color: '#F97316', rarity: 'rare' },
  { id: 'double_hit', name: 'Doble Impacto', symbol: '💥💥', description: 'Doble onda de choque expansiva', color: '#E11D48', rarity: 'epic' },
  { id: 'bounce', name: 'Rebote', symbol: '↩️', description: 'El proyectil rebota una vez antes de detonar', color: '#06B6D4', rarity: 'epic' }
];

export interface PlayerState {
  id: string;
  name: string;
  displayLobbyName: string;
  characterId: CharacterId | null;
  hp: number;
  maxHp: number;
  lives: number;
  maxLives: number;
  angle: number;
  power: number; // 0 - 100
  activePowerUp: PowerUpType | null;
  position: { x: number; y: number };
  isReady: boolean;
  score: number;
}

export type GameTimeOption = '5_MIN' | 'INFINITE';
export type GameLivesOption = 1 | 3 | 5 | 'INFINITE';

export type GameScreen = 
  | 'menu' 
  | 'create_room' 
  | 'join_room' 
  | 'waiting_opponent'
  | 'char_select' 
  | 'battle' 
  | 'ranking' 
  | 'admin'
  | 'contact';

export interface WindState {
  speed: number; // e.g. 12 km/h
  direction: -1 | 1; // -1: left, 1: right
  angleDeg: number;
}

export type MatchStatus = 'waiting' | 'starting' | 'playing' | 'finished' | 'cancelled';

export interface OnlinePlayer {
  id: string;
  /** Firebase Auth UID used only to authorize Firestore operations. */
  authUid?: string;
  name: string;
  characterId: CharacterId | null;
  characterSelected: boolean;
  hp: number;
  maxHp: number;
  lives: number;
  maxLives: number;
  score: number; // Damage dealt during match
  position: { x: number; y: number };
  isReady: boolean;
}

export interface OnlineShotEvent {
  shotId: string;
  shooterPlayerId: string;
  shooterRole: 'player1' | 'player2';
  angle: number;
  power: number;
  powerUpType: PowerUpType | null;
  windSpeed: number;
  windDirection: -1 | 1;
  timestamp: number;
}

export interface OnlineImpactEvent {
  shotId: string;
  hitX: number;
  hitY: number;
  damage: number;
  targetPlayerId: string | null;
  isWater: boolean;
  timestamp: number;
}

export interface OnlineGameState {
  currentTurnPlayerId: string;
  turnStartedAt: number;
  turnDuration: number; // 45 seconds
  matchStartedAt: number;
  matchEndAt: number | null; // null for infinite, timestamp for 300s
  wind: WindState;
  lastShot: OnlineShotEvent | null;
  lastImpact: OnlineImpactEvent | null;
  winnerPlayerId: string | null;
  loserPlayerId: string | null;
  finishReason: 'lives_depleted' | 'time_expired' | 'voluntary_surrender' | 'opponent_disconnected' | null;
  finishedAt: number | null;
  processedForRanking?: boolean;
}

export interface OnlineMatch {
  matchId: string;
  status: MatchStatus;
  creatorPlayerId: string;
  creatorPlayerName: string;
  settings: {
    timeLimit: 300 | null; // 300 seconds for 5 min, null for infinite
    lives: 1 | 3 | 5;
    islandId: string;
  };
  player1: OnlinePlayer;
  player2: OnlinePlayer | null;
  gameState: OnlineGameState;
  createdAt: number;
  updatedAt: number;
  isAiMatch?: boolean;
}

export interface OnlinePresence {
  playerId: string;
  matchId: string;
  lastSeenAt: number;
  status: 'online' | 'disconnected' | 'abandoned';
}

export interface GameRoom {
  id: string;
  name: string;
  creatorName: string;
  timeLimit: GameTimeOption;
  lives: GameLivesOption;
  status: 'waiting' | 'starting' | 'character_select' | 'in_progress' | 'completed' | 'abandoned';
  islandId: string;
  player1: PlayerState;
  player2: PlayerState | null;
  currentTurn: 'player1' | 'player2';
  wind: WindState;
  turnTimer: number; // countdown in seconds per turn (e.g. 45s)
  matchTimer: number; // countdown in seconds (300 for 5 min, -1 for infinite)
  turnNumber: number;
  winner: 'player1' | 'player2' | null;
  surrender: boolean;
  surrenderMessage?: string;
  createdAt: number;
  updatedAt: number;
  isAiMatch?: boolean;
  onlineMatchId?: string;
}

export interface IslandConfig {
  id: string;
  number: number;
  name: string;
  title: string;
  subtitle: string;
  leftIsland: {
    startCol: number;
    endCol: number;
    blocks: { col: number; height: number; decoration?: 'crate' | 'palm' | 'hut' }[];
    spawnCol: number;
  };
  rightIsland: {
    startCol: number;
    endCol: number;
    blocks: { col: number; height: number; decoration?: 'crate' | 'palm' }[];
    spawnCol: number;
  };
  totalColumns: number;
  maxHeight: number;
}

export interface PlayerRanking {
  playerName: string;
  score: number;
  victories: number;
  defeats: number;
  lastPlayedAt?: string;
}

export interface AdminMetrics {
  totalRoomsCreated: number;
  totalRoomsCompleted: number;
  totalRoomsAbandoned: number;
  totalMatches: number;
  totalPlayers: number;
  characterPicks: Record<CharacterId, number>;
  characterWins: Record<CharacterId, number>;
  recentActivity: {
    id: string;
    timestamp: number;
    type: 'created' | 'joined' | 'completed' | 'abandoned';
    detail: string;
  }[];
}
