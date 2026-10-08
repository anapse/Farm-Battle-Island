import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, isConfigured, ensureFirebaseAuth } from './firebase';
import { 
  OnlineMatch, 
  OnlinePlayer, 
  OnlineGameState, 
  MatchStatus, 
  CharacterId, 
  PowerUpType, 
  WindState 
} from '../types/game';
import { recordMatchRankingResult } from './rankingService';
import { trackRoomCreated, trackRoomCompleted, trackRoomAbandoned, trackCharacterPick } from './adminService';

const PLAYER_ID_KEY = 'fbi_persistent_player_id';
const LOCAL_MATCHES_KEY = 'fbi_local_matches_cache';

// BroadcastChannel for instant local cross-tab sync as offline/local companion
let localChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localChannel = new BroadcastChannel('fbi_online_matches_channel');
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }
}

/**
 * Get or create unique persistent player identity
 */
export function getPlayerIdentity(defaultName: string = 'Comandante'): { playerId: string; playerName: string } {
  let playerId = '';
  let storedName = '';

  if (typeof window !== 'undefined') {
    playerId = localStorage.getItem(PLAYER_ID_KEY) || '';
    storedName = localStorage.getItem('fbi_stored_player_name') || '';

    if (!playerId) {
      playerId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(PLAYER_ID_KEY, playerId);
    }
  } else {
    playerId = `usr_srv_${Date.now()}`;
  }

  const playerName = storedName || defaultName;
  return { playerId, playerName };
}

/**
 * Local cache helpers for resilient offline/dev mode
 */
function getLocalMatches(): OnlineMatch[] {
  try {
    const raw = localStorage.getItem(LOCAL_MATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMatch(match: OnlineMatch): void {
  try {
    const matches = getLocalMatches();
    const idx = matches.findIndex(m => m.matchId === match.matchId);
    if (idx >= 0) {
      matches[idx] = match;
    } else {
      matches.unshift(match);
    }
    localStorage.setItem(LOCAL_MATCHES_KEY, JSON.stringify(matches));
    if (localChannel) {
      localChannel.postMessage({ type: 'MATCH_UPDATED', matchId: match.matchId, match });
    }
  } catch (e) {
    console.warn('Failed to save local match:', e);
  }
}

/**
 * Create a new match in Firestore / Local Cache
 */
export async function createOnlineMatch(params: {
  creatorPlayerName: string;
  timeLimitSeconds: 300 | null;
  lives: 1 | 3 | 5;
  islandId: string;
  isAiMatch?: boolean;
}): Promise<OnlineMatch> {
  await ensureFirebaseAuth();
  const { playerId } = getPlayerIdentity(params.creatorPlayerName);
  const authUid = auth?.currentUser?.uid || undefined;
  const matchId = `M_${Math.floor(100000 + Math.random() * 900000)}`;

  const player1: OnlinePlayer = {
    id: playerId,
    authUid,
    name: params.creatorPlayerName,
    characterId: null,
    characterSelected: false,
    hp: 100,
    maxHp: 100,
    lives: params.lives,
    maxLives: params.lives,
    score: 0,
    position: { x: 380, y: 440 },
    isReady: false
  };

  let player2: OnlinePlayer | null = null;
  let status: MatchStatus = 'waiting';

  if (params.isAiMatch) {
    const aiChar: CharacterId = 'tortuga';
    player2 = {
      id: 'ai_bot_opponent',
      name: 'Rival Táctico (IA)',
      characterId: aiChar,
      characterSelected: true,
      hp: 100,
      maxHp: 100,
      lives: params.lives,
      maxLives: params.lives,
      score: 0,
      position: { x: 1720, y: 440 },
      isReady: true
    };
    status = 'starting';
  }

  const initialGameState: OnlineGameState = {
    currentTurnPlayerId: playerId,
    turnStartedAt: Date.now(),
    turnDuration: 25,
    matchStartedAt: Date.now(),
    matchEndAt: params.timeLimitSeconds ? Date.now() + params.timeLimitSeconds * 1000 : null,
    wind: {
      speed: Math.floor(Math.random() * 20) + 4,
      direction: Math.random() > 0.5 ? 1 : -1,
      angleDeg: 35
    },
    lastShot: null,
    lastImpact: null,
    winnerPlayerId: null,
    loserPlayerId: null,
    finishReason: null,
    finishedAt: null
  };

  const newMatch: OnlineMatch = {
    matchId,
    status,
    creatorPlayerId: playerId,
    creatorPlayerName: params.creatorPlayerName,
    settings: {
      timeLimit: params.timeLimitSeconds,
      lives: params.lives,
      islandId: params.islandId
    },
    player1,
    player2,
    gameState: initialGameState,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isAiMatch: !!params.isAiMatch
  };

  // 1. Save to Firestore if available
  if (db && isConfigured) {
    try {
      const matchDocRef = doc(db, 'matches', matchId);
      await setDoc(matchDocRef, newMatch);
    } catch (e) {
      console.warn('Firestore createDoc warning, falling back to local sync:', e);
    }
  }

  // 2. Always persist to local cache for instant zero-latency UI
  saveLocalMatch(newMatch);
  trackRoomCreated(`Partida #${matchId}`, params.creatorPlayerName);

  return newMatch;
}

/**
 * Join an existing match
 * Protections: Two players cannot take the same slot. Full match cannot be joined.
 */
export async function joinOnlineMatch(matchId: string, joinerPlayerName: string): Promise<OnlineMatch> {
  await ensureFirebaseAuth();
  const { playerId } = getPlayerIdentity(joinerPlayerName);
  const authUid = auth?.currentUser?.uid || undefined;

  if (db && isConfigured) {
    try {
      const matchDocRef = doc(db, 'matches', matchId);
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(matchDocRef);
        if (!snap.exists()) {
          throw new Error('La partida ya no existe.');
        }

        const data = snap.data() as OnlineMatch;
        if (data.status !== 'waiting' || data.player2 !== null) {
          throw new Error('Esta partida ya está completa o ya ha comenzado.');
        }

        if (data.player1.id === playerId) {
          throw new Error('No puedes unirte como oponente a tu propia partida.');
        }

        const player2: OnlinePlayer = {
          id: playerId,
          authUid,
          name: joinerPlayerName,
          characterId: null,
          characterSelected: false,
          hp: 100,
          maxHp: 100,
          lives: data.settings.lives,
          maxLives: data.settings.lives,
          score: 0,
          position: { x: 1720, y: 440 },
          isReady: false
        };

        const updated: Partial<OnlineMatch> = {
          player2,
          status: 'starting',
          updatedAt: Date.now()
        };

        transaction.update(matchDocRef, updated);
        const merged = { ...data, ...updated, player2 } as OnlineMatch;
        saveLocalMatch(merged);
        return merged;
      });
    } catch (e) {
      console.warn('Firestore transaction failed, falling back to local memory join:', e);
    }
  }

  // Fallback local memory join
  const localMatches = getLocalMatches();
  const match = localMatches.find(m => m.matchId === matchId);
  if (!match) throw new Error('Partida no encontrada.');
  if (match.status !== 'waiting' || match.player2 !== null) {
    throw new Error('Esta partida ya está completa o ya ha comenzado.');
  }

  match.player2 = {
    id: playerId,
    authUid,
    name: joinerPlayerName,
    characterId: null,
    characterSelected: false,
    hp: 100,
    maxHp: 100,
    lives: match.settings.lives,
    maxLives: match.settings.lives,
    score: 0,
    position: { x: 1720, y: 440 },
    isReady: false
  };
  match.status = 'starting';
  match.updatedAt = Date.now();

  saveLocalMatch(match);
  return match;
}

/**
 * Character Selection with ABSOLUTE EXCLUSION RULE:
 * Both players CANNOT pick the same character!
 */
export async function selectCharacterOnline(
  matchId: string, 
  playerId: string, 
  characterId: CharacterId
): Promise<OnlineMatch> {
  if (db && isConfigured) {
    try {
      const matchDocRef = doc(db, 'matches', matchId);
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(matchDocRef);
        if (!snap.exists()) throw new Error('Partida no encontrada');

        const match = snap.data() as OnlineMatch;
        const isP1 = match.player1.id === playerId;
        const isP2 = match.player2?.id === playerId;

        if (!isP1 && !isP2) throw new Error('No perteneces a esta partida');

        // Check if rival has already chosen this character
        const rivalCharId = isP1 ? match.player2?.characterId : match.player1.characterId;
        if (rivalCharId && rivalCharId === characterId) {
          throw new Error('¡Ese personaje ya fue elegido por tu rival! Selecciona otro.');
        }

        trackCharacterPick(characterId);

        if (isP1) {
          match.player1.characterId = characterId;
          match.player1.characterSelected = true;
        } else if (match.player2) {
          match.player2.characterId = characterId;
          match.player2.characterSelected = true;
        }

        // When both players have selected their character, START COMBAT!
        const p1Ready = match.player1.characterSelected;
        const p2Ready = match.player2 ? match.player2.characterSelected : false;

        if (p1Ready && p2Ready) {
          match.status = 'playing';
          match.gameState.matchStartedAt = Date.now();
          match.gameState.turnStartedAt = Date.now();
          if (match.settings.timeLimit) {
            match.gameState.matchEndAt = Date.now() + match.settings.timeLimit * 1000;
          }
        }

        match.updatedAt = Date.now();
        transaction.update(matchDocRef, match);
        saveLocalMatch(match);
        return match;
      });
    } catch (e) {
      console.warn('Firestore selectCharacter error, fallback to local:', e);
    }
  }

  // Local fallback
  const match = getLocalMatches().find(m => m.matchId === matchId);
  if (!match) throw new Error('Partida no encontrada');

  const isP1 = match.player1.id === playerId;
  const rivalCharId = isP1 ? match.player2?.characterId : match.player1.characterId;
  if (rivalCharId && rivalCharId === characterId) {
    throw new Error('¡Ese personaje ya fue elegido por tu rival! Selecciona otro.');
  }

  if (isP1) {
    match.player1.characterId = characterId;
    match.player1.characterSelected = true;
  } else if (match.player2) {
    match.player2.characterId = characterId;
    match.player2.characterSelected = true;
  }

  if (match.player1.characterSelected && match.player2?.characterSelected) {
    match.status = 'playing';
    match.gameState.matchStartedAt = Date.now();
    match.gameState.turnStartedAt = Date.now();
    if (match.settings.timeLimit) {
      match.gameState.matchEndAt = Date.now() + match.settings.timeLimit * 1000;
    }
  }

  match.updatedAt = Date.now();
  saveLocalMatch(match);
  return match;
}

/**
 * Real-time match state listener
 */
export function subscribeToOnlineMatch(
  matchId: string, 
  callback: (match: OnlineMatch | null) => void
): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (db && isConfigured) {
    try {
      const matchDocRef = doc(db, 'matches', matchId);
      unsubFirestore = onSnapshot(matchDocRef, (snap) => {
        if (snap.exists()) {
          const match = snap.data() as OnlineMatch;
          saveLocalMatch(match);
          callback(match);
        } else {
          callback(null);
        }
      }, (err) => {
        console.warn('Firestore match subscribe error:', err);
      });
    } catch (e) {
      console.warn('Failed to subscribe to firestore match:', e);
    }
  }

  // Cross-tab broadcast listener for local instances
  const channelListener = (e: MessageEvent) => {
    if (e.data && e.data.matchId === matchId) {
      callback(e.data.match);
    }
  };

  if (localChannel) {
    localChannel.addEventListener('message', channelListener);
  }

  // Initial call with local cached match
  const initial = getLocalMatches().find(m => m.matchId === matchId);
  if (initial) {
    callback(initial);
  }

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (localChannel) localChannel.removeEventListener('message', channelListener);
  };
}

/**
 * List available rooms waiting for an opponent
 */
export function subscribeToAvailableMatches(
  callback: (matches: OnlineMatch[]) => void
): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (db && isConfigured) {
    try {
      const q = query(
        collection(db, 'matches'),
        where('status', '==', 'waiting'),
        limit(25)
      );

      unsubFirestore = onSnapshot(q, (snapshot) => {
        const matches: OnlineMatch[] = [];
        snapshot.forEach((doc) => {
          matches.push(doc.data() as OnlineMatch);
        });
        callback(matches);
      }, (err) => {
        console.warn('Firestore available matches error:', err);
        // Fallback to local
        const local = getLocalMatches().filter(m => m.status === 'waiting');
        callback(local);
      });
    } catch (e) {
      console.warn('Failed query available matches:', e);
      const local = getLocalMatches().filter(m => m.status === 'waiting');
      callback(local);
    }
  } else {
    // Pure local
    const local = getLocalMatches().filter(m => m.status === 'waiting');
    callback(local);
  }

  const channelListener = () => {
    const local = getLocalMatches().filter(m => m.status === 'waiting');
    callback(local);
  };

  if (localChannel) {
    localChannel.addEventListener('message', channelListener);
  }

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (localChannel) localChannel.removeEventListener('message', channelListener);
  };
}

/**
 * Send ballistic firing shot event
 */
export async function sendShotOnline(params: {
  matchId: string;
  playerId: string;
  shooterRole: 'player1' | 'player2';
  angle: number;
  power: number;
  powerUpType: PowerUpType | null;
  windSpeed: number;
  windDirection: -1 | 1;
}): Promise<void> {
  const shotEvent = {
    shotId: `shot_${Date.now()}`,
    shooterPlayerId: params.playerId,
    shooterRole: params.shooterRole,
    angle: params.angle,
    power: params.power,
    powerUpType: params.powerUpType,
    windSpeed: params.windSpeed,
    windDirection: params.windDirection,
    timestamp: Date.now()
  };

  if (db && isConfigured && await ensureFirebaseAuth()) {
    try {
      const matchDocRef = doc(db, 'matches', params.matchId);
      await updateDoc(matchDocRef, {
        'gameState.lastShot': shotEvent,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn('Firestore sendShot error:', e);
    }
  }

  const local = getLocalMatches().find(m => m.matchId === params.matchId);
  if (local) {
    local.gameState.lastShot = shotEvent;
    local.updatedAt = Date.now();
    saveLocalMatch(local);
  }
}

/**
 * Synchronize damage, points, and life loss
 * RULE: PUNTOS = DAÑO REALIZADO
 */
export async function registerImpactOnline(params: {
  matchId: string;
  targetRole: 'player1' | 'player2';
  damage: number;
  hitX: number;
  hitY: number;
  isWater: boolean;
}): Promise<OnlineMatch | null> {
  const impactEvent = {
    shotId: `impact_${Date.now()}`,
    hitX: params.hitX,
    hitY: params.hitY,
    damage: params.damage,
    targetPlayerId: null,
    isWater: params.isWater,
    timestamp: Date.now()
  };

  const local = getLocalMatches().find(m => m.matchId === params.matchId);
  if (!local) return null;

  const targetPlayer = params.targetRole === 'player1' ? local.player1 : local.player2;
  const attackerPlayer = params.targetRole === 'player1' ? local.player2 : local.player1;

  if (targetPlayer && attackerPlayer) {
    // 1. Subtract HP
    targetPlayer.hp = Math.max(0, targetPlayer.hp - params.damage);
    // 2. Points = Damage dealt
    attackerPlayer.score += params.damage;

    // 3. Check life loss & respawn
    if (targetPlayer.hp <= 0) {
      targetPlayer.lives -= 1;
      if (targetPlayer.lives > 0) {
        targetPlayer.hp = targetPlayer.maxHp;
      } else {
        targetPlayer.lives = 0;
        targetPlayer.hp = 0;
      }
    }
  }

  local.gameState.lastImpact = impactEvent;
  local.updatedAt = Date.now();
  saveLocalMatch(local);

  if (targetPlayer && attackerPlayer && targetPlayer.lives <= 0) {
    await concludeMatchOnline({
      matchId: params.matchId,
      winnerPlayerId: attackerPlayer.id,
      loserPlayerId: targetPlayer.id,
      reason: 'lives_depleted'
    });
    return getLocalMatches().find(m => m.matchId === params.matchId) || local;
  }

  if (db && isConfigured && await ensureFirebaseAuth()) {
    try {
      const matchDocRef = doc(db, 'matches', params.matchId);
      await updateDoc(matchDocRef, {
        'gameState.lastImpact': impactEvent,
        updatedAt: Date.now()
      });
    } catch (e) {
      // Local state was already updated; Firestore failure must not freeze the HUD.
      console.warn('Firestore registerImpact error:', e);
    }
  }

  return local;
}

/**
 * Change turn atomically with 25s turn timestamp
 */
export async function changeTurnOnline(
  matchId: string, 
  nextPlayerId: string, 
  newWindSpeed: number, 
  newWindDirection: -1 | 1
): Promise<OnlineMatch | null> {
  const updatePayload = {
    'gameState.currentTurnPlayerId': nextPlayerId,
    'gameState.turnStartedAt': Date.now(),
    'gameState.wind.speed': newWindSpeed,
    'gameState.wind.direction': newWindDirection,
    updatedAt: Date.now()
  };

  const local = getLocalMatches().find(m => m.matchId === matchId);
  if (local) {
    const turnStartedAt = Date.now();
    local.gameState.currentTurnPlayerId = nextPlayerId;
    local.gameState.turnStartedAt = turnStartedAt;
    local.gameState.wind.speed = newWindSpeed;
    local.gameState.wind.direction = newWindDirection;
    local.updatedAt = turnStartedAt;
    saveLocalMatch(local);
  }

  if (db && isConfigured && await ensureFirebaseAuth()) {
    try {
      const matchDocRef = doc(db, 'matches', matchId);
      await updateDoc(matchDocRef, {
        ...updatePayload,
        'gameState.turnStartedAt': local?.gameState.turnStartedAt || updatePayload['gameState.turnStartedAt']
      });
    } catch (e) {
      console.warn('Firestore changeTurn error:', e);
    }
  }

  return local || null;
}

/**
 * Conclude Match with IDEMPOTENCY PROTECTION (Never duplicate scores/victories/defeats)
 * RULE: Bono de victoria = +50% de vida máxima (+50 puntos)
 * RULE: El perdedor conserva sus puntos obtenidos
 */
export async function concludeMatchOnline(params: {
  matchId: string;
  winnerPlayerId: string;
  loserPlayerId: string;
  reason: 'lives_depleted' | 'time_expired' | 'voluntary_surrender' | 'opponent_disconnected';
}): Promise<OnlineMatch | null> {
  // Combat HP/lives/score are local match state. Firestore is only the
  // authoritative place for the finished result metadata.
  const localBeforeFinish = getLocalMatches().find(m => m.matchId === params.matchId) || null;
  let finalMatch: OnlineMatch | null = localBeforeFinish;

  if (db && isConfigured && await ensureFirebaseAuth()) {
    try {
      const matchDocRef = doc(db, 'matches', params.matchId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(matchDocRef);
        if (!snap.exists()) return null;

        const match = snap.data() as OnlineMatch;

        // Protection: If already finished, return as-is to prevent duplicate calculations
        if (match.status === 'finished' || match.gameState.processedForRanking) {
          return match;
        }

        const isWinnerP1 = match.player1.id === params.winnerPlayerId;
        const winner = isWinnerP1 ? match.player1 : match.player2;
        const loser = isWinnerP1 ? match.player2 : match.player1;

        if (winner) {
          // Add 50% max HP victory bonus (+50 points)
          winner.score += 50;
        }

        match.status = 'finished';
        match.gameState.winnerPlayerId = params.winnerPlayerId;
        match.gameState.loserPlayerId = params.loserPlayerId;
        match.gameState.finishReason = params.reason;
        match.gameState.finishedAt = Date.now();
        match.gameState.processedForRanking = true;
        match.updatedAt = Date.now();

        transaction.update(matchDocRef, {
          status: match.status,
          'gameState.winnerPlayerId': match.gameState.winnerPlayerId,
          'gameState.loserPlayerId': match.gameState.loserPlayerId,
          'gameState.finishReason': match.gameState.finishReason,
          'gameState.finishedAt': match.gameState.finishedAt,
          'gameState.processedForRanking': match.gameState.processedForRanking,
          updatedAt: match.updatedAt
        });
        return match;
      });
    } catch (e) {
      console.warn('Firestore concludeMatch error, handling locally:', e);
    }
  }

  if (!finalMatch) {
    const local = getLocalMatches().find(m => m.matchId === params.matchId);
    if (!local) return null;

    if (local.status === 'finished' || local.gameState.processedForRanking) {
      return local;
    }

    const isWinnerP1 = local.player1.id === params.winnerPlayerId;
    const winner = isWinnerP1 ? local.player1 : local.player2;

    if (winner) {
      winner.score += 50;
    }

    local.status = 'finished';
    local.gameState.winnerPlayerId = params.winnerPlayerId;
    local.gameState.loserPlayerId = params.loserPlayerId;
    local.gameState.finishReason = params.reason;
    local.gameState.finishedAt = Date.now();
    local.gameState.processedForRanking = true;
    local.updatedAt = Date.now();

    saveLocalMatch(local);
    finalMatch = local;
  }

  // Even when Firestore successfully claims the finish, update the local
  // combat state so the real score/lives from this device are used for ranking.
  if (finalMatch && !finalMatch.gameState.processedForRanking) {
    const isWinnerP1 = finalMatch.player1.id === params.winnerPlayerId;
    const winner = isWinnerP1 ? finalMatch.player1 : finalMatch.player2;
    if (winner) {
      winner.score += 50;
    }
    finalMatch.status = 'finished';
    finalMatch.gameState.winnerPlayerId = params.winnerPlayerId;
    finalMatch.gameState.loserPlayerId = params.loserPlayerId;
    finalMatch.gameState.finishReason = params.reason;
    finalMatch.gameState.finishedAt = Date.now();
    finalMatch.gameState.processedForRanking = true;
    finalMatch.updatedAt = Date.now();
    saveLocalMatch(finalMatch);
  }

  // Update TOP 50 Leaderboard & Stats
  if (finalMatch && finalMatch.gameState.processedForRanking) {
    const isWinnerP1 = finalMatch.player1.id === params.winnerPlayerId;
    const winner = isWinnerP1 ? finalMatch.player1 : finalMatch.player2;
    const loser = isWinnerP1 ? finalMatch.player2 : finalMatch.player1;

    if (winner) {
      await recordMatchRankingResult(winner.name, winner.score, true);
    }
    if (loser) {
      await recordMatchRankingResult(loser.name, loser.score, false);
    }

    if (params.reason === 'voluntary_surrender' || params.reason === 'opponent_disconnected') {
      trackRoomAbandoned(loser?.name || 'Rival', winner?.name || 'Comandante');
    } else {
      trackRoomCompleted(winner?.characterId || null, loser?.characterId || null);
    }
  }

  return finalMatch;
}

/**
 * Voluntary Surrender / Abandonment
 * RULE: El que abandona recibe DERROTA automática. El oponente VICTORIA con bono.
 */
export async function surrenderMatchOnline(matchId: string, surrenderingPlayerId: string): Promise<OnlineMatch | null> {
  const local = getLocalMatches().find(m => m.matchId === matchId);
  if (!local) return null;

  const opponentId = local.player1.id === surrenderingPlayerId 
    ? (local.player2?.id || 'bot_ai') 
    : local.player1.id;

  return await concludeMatchOnline({
    matchId,
    winnerPlayerId: opponentId,
    loserPlayerId: surrenderingPlayerId,
    reason: 'voluntary_surrender'
  });
}

/**
 * Presence Heartbeat to detect real disconnects
 */
export async function sendPresenceHeartbeat(matchId: string, playerId: string): Promise<void> {
  if (db && isConfigured && await ensureFirebaseAuth()) {
    try {
      const presenceId = auth?.currentUser?.uid || playerId;
      const presenceDocRef = doc(db, 'presence', presenceId);
      await setDoc(presenceDocRef, {
        playerId,
        authUid: auth?.currentUser?.uid || null,
        matchId,
        lastSeenAt: Date.now(),
        status: 'online'
      }, { merge: true });
    } catch {
      // Non-critical background ping
    }
  }
}
