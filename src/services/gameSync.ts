import { 
  GameRoom, 
  PlayerState, 
  CharacterId, 
  GameTimeOption, 
  GameLivesOption, 
  WindState 
} from '../types/game';
import { trackRoomCreated, trackRoomCompleted, trackRoomAbandoned, trackCharacterPick } from './adminService';
import { recordMatchResult } from './rankingService';
import { CHARACTERS } from '../config/characters';

let localRoomsCache: GameRoom[] = [];

// Remove legacy persisted rooms so match progress is not retained between visits.
if (typeof window !== 'undefined') {
  try { localStorage.removeItem('fbi_active_rooms'); } catch { /* Storage may be unavailable. */ }
}
const BROADCAST_CHANNEL_NAME = 'fbi_sync_channel';

// Cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

export function getAllRooms(): GameRoom[] {
  return localRoomsCache;
}

export function saveAllRooms(rooms: GameRoom[]) {
  localRoomsCache = rooms;
  broadcastChannel?.postMessage({ type: 'ROOMS_UPDATED', timestamp: Date.now() });
}

/**
 * Get available rooms for UNIRSE modal.
 * Rule: Rooms with 2 players disappear from the available list.
 * Rule: Disambiguate duplicate creator names ONLY in the lobby (e.g. "Juan", "Juan 2", "Juan 3")
 * while the in-game player name remains "Juan".
 */
export function getAvailableLobbyRooms(): {
  room: GameRoom;
  displayCreatorName: string;
}[] {
  const all = getAllRooms();
  const available = all.filter(r => r.status === 'waiting' && (!r.player2 || !r.player2.id));

  // Count creator names to disambiguate in lobby display
  const nameCounts: Record<string, number> = {};
  const currentCount: Record<string, number> = {};

  available.forEach(r => {
    const rawName = r.creatorName.trim();
    nameCounts[rawName] = (nameCounts[rawName] || 0) + 1;
  });

  return available.map(r => {
    const rawName = r.creatorName.trim();
    let displayCreatorName = rawName;
    if (nameCounts[rawName] > 1) {
      currentCount[rawName] = (currentCount[rawName] || 0) + 1;
      displayCreatorName = currentCount[rawName] === 1 ? rawName : `${rawName} ${currentCount[rawName]}`;
    }
    return {
      room: r,
      displayCreatorName
    };
  });
}

export function createRoom(
  creatorName: string, 
  timeLimit: GameTimeOption = '5_MIN', 
  lives: GameLivesOption = 3,
  isAiMatch: boolean = false
): GameRoom {
  const rooms = getAllRooms();
  const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
  const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
  const trimmedName = creatorName.trim() || 'Jugador 1';

  const initialWind: WindState = {
    speed: Math.floor(Math.random() * 20) + 5, // 5 to 25 km/h
    direction: Math.random() > 0.5 ? 1 : -1,
    angleDeg: 35
  };

  const newRoom: GameRoom = {
    id: roomId,
    name: `Partida de ${trimmedName}`,
    creatorName: trimmedName,
    timeLimit,
    lives,
    status: 'character_select',
    islandId: 'isla_1',
    player1: {
      id: playerId,
      name: trimmedName,
      displayLobbyName: trimmedName,
      characterId: null,
      hp: 100,
      maxHp: 100,
      lives,
      maxLives: lives,
      angle: 35,
      power: 62,
      activePowerUp: null,
      position: { x: 4, y: 3 },
      isReady: false,
      score: 0
    },
    player2: isAiMatch ? {
      id: 'ai_bot',
      name: 'IA Guardián',
      displayLobbyName: 'IA Guardián',
      characterId: null, // Will pick after player 1 picks
      hp: 100,
      maxHp: 100,
      lives,
      maxLives: lives,
      angle: 42,
      power: 65,
      activePowerUp: null,
      position: { x: 27, y: 2 },
      isReady: true,
      score: 0
    } : null,
    currentTurn: 'player1',
    wind: initialWind,
    turnTimer: 45,
    matchTimer: timeLimit === '5_MIN' ? 300 : -1,
    turnNumber: 1,
    winner: null,
    surrender: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isAiMatch
  };

  rooms.push(newRoom);
  saveAllRooms(rooms);
  trackRoomCreated(newRoom.name, trimmedName);

  return newRoom;
}

export function joinRoom(roomId: string, joinerName: string): GameRoom {
  const rooms = getAllRooms();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) throw new Error('Sala no encontrada');

  const room = rooms[roomIndex];
  if (room.player2 && room.player2.id) {
    throw new Error('La sala ya tiene 2 jugadores');
  }

  const trimmedName = joinerName.trim() || 'Jugador 2';
  const player2Id = 'player_' + Math.random().toString(36).substring(2, 9);

  room.player2 = {
    id: player2Id,
    name: trimmedName,
    displayLobbyName: trimmedName,
    characterId: null,
    hp: 100,
    maxHp: 100,
    lives: room.lives,
    maxLives: room.lives,
    angle: 45,
    power: 60,
    activePowerUp: null,
    position: { x: 27, y: 2 },
    isReady: false,
    score: 0
  };

  room.status = 'character_select';
  room.updatedAt = Date.now();

  rooms[roomIndex] = room;
  saveAllRooms(rooms);

  return room;
}

/**
 * Character selection with strictly enforced mutual exclusion:
 * "LOS DOS JUGADORES NO PUEDEN UTILIZAR EL MISMO PERSONAJE."
 */
export function selectCharacter(
  roomId: string, 
  playerId: string, 
  characterId: CharacterId
): GameRoom {
  const rooms = getAllRooms();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) throw new Error('Sala no encontrada');

  const room = rooms[roomIndex];
  const isP1 = room.player1.id === playerId;
  const isP2 = room.player2?.id === playerId;

  if (!isP1 && !isP2) throw new Error('El jugador no pertenece a esta sala');

  // Verify that the other player hasn't already chosen this character
  const rivalCharacter = isP1 ? room.player2?.characterId : room.player1.characterId;
  if (rivalCharacter && rivalCharacter === characterId) {
    throw new Error('Este personaje ya ha sido seleccionado por tu rival. Elige uno diferente.');
  }

  if (isP1) {
    room.player1.characterId = characterId;
    room.player1.isReady = true;
    trackCharacterPick(characterId);

    // If vs AI, the AI selects an available character different from player 1
    if (room.isAiMatch && room.player2) {
      const remainingForAi = CHARACTERS.filter(c => c.id !== characterId);
      const randomAiChoice = remainingForAi[Math.floor(Math.random() * remainingForAi.length)].id;
      room.player2.characterId = randomAiChoice;
      room.player2.isReady = true;
      trackCharacterPick(randomAiChoice);
    }
  } else if (room.player2) {
    room.player2.characterId = characterId;
    room.player2.isReady = true;
    trackCharacterPick(characterId);
  }

  // If both players have selected and are ready, start battle!
  if (room.player1.characterId && room.player2?.characterId) {
    room.status = 'in_progress';
  }

  room.updatedAt = Date.now();
  rooms[roomIndex] = room;
  saveAllRooms(rooms);

  return room;
}

/**
 * ABSOLUTE RULE:
 * EL JUEGO NO SE PUEDE PAUSAR.
 * Si un jugador sale, cierra la ventana o abandona voluntariamente:
 * Se considera DERROTA para el que sale y VICTORIA para el que permanece (+ bono victoria).
 */
export function handlePlayerAbandonment(
  roomId: string, 
  leaverPlayerId: string, 
  reason: string = 'Abandono de partida'
): { room: GameRoom; winnerPlayer: PlayerState; loserPlayer: PlayerState } {
  const rooms = getAllRooms();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) throw new Error('Sala no encontrada');

  const room = rooms[roomIndex];
  const isP1Leaver = room.player1.id === leaverPlayerId;
  const leaver = isP1Leaver ? room.player1 : room.player2!;
  const survivor = isP1Leaver ? room.player2! : room.player1;

  room.status = 'abandoned';
  room.surrender = true;
  room.winner = isP1Leaver ? 'player2' : 'player1';
  room.surrenderMessage = `${leaver.name} abandonó la partida. Derrota computada.`;
  room.updatedAt = Date.now();

  rooms[roomIndex] = room;
  saveAllRooms(rooms);

  // Record ranking updates
  const victoryBonus = 350;
  recordMatchResult(survivor.name, true, victoryBonus);
  recordMatchResult(leaver.name, false, 0);

  // Track in Admin Metrics
  trackRoomAbandoned(leaver.name, survivor.name);

  return { room, winnerPlayer: survivor, loserPlayer: leaver };
}

/**
 * Normal game completion when life reaches 0
 */
export function handleGameVictory(
  roomId: string, 
  winnerRole: 'player1' | 'player2'
): GameRoom {
  const rooms = getAllRooms();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) return getAllRooms()[0];

  const room = rooms[roomIndex];
  room.status = 'completed';
  room.winner = winnerRole;
  room.updatedAt = Date.now();

  const winner = winnerRole === 'player1' ? room.player1 : room.player2!;
  const loser = winnerRole === 'player1' ? room.player2! : room.player1;

  recordMatchResult(winner.name, true, 400);
  if (loser) recordMatchResult(loser.name, false, 50);

  trackRoomCompleted(winner.characterId, loser?.characterId || null);

  rooms[roomIndex] = room;
  saveAllRooms(rooms);

  return room;
}

export function subscribeToRoomSync(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === ROOMS_STORAGE_KEY) callback();
  };
  const handleMessage = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  broadcastChannel?.addEventListener('message', handleMessage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    broadcastChannel?.removeEventListener('message', handleMessage);
  };
}
