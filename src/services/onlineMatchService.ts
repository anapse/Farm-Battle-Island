import { ref, set, update, onValue, runTransaction, remove } from 'firebase/database';
import { rtdb, auth, isConfigured, ensureFirebaseAuth } from './firebase';
import { 
  OnlineMatch, 
  OnlinePlayer, 
  OnlineGameState, 
  MatchStatus, 
  CharacterId, 
  GameLivesOption,
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
export function getPlayerIdentity(defaultName: string = ''): { playerId: string; playerName: string } {
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
 * Firestore stores only lobby/match-control data for active matches.
 * Combat state (HP, lives and damage score) stays local to the running match.
 */
function toPersistentPlayer(player: OnlinePlayer) {
  const {
    hp: _hp,
    maxHp: _maxHp,
    lives: _lives,
    maxLives: _maxLives,
    score: _score,
    ...persistent
  } = player;
  return persistent;
}

function hydratePlayer(
  player: Partial<OnlinePlayer>,
  defaultLives: OnlineMatch['settings']['lives'],
  cached?: OnlinePlayer | null
): OnlinePlayer {
  return {
    ...player,
    id: player.id || cached?.id || '',
    name: player.name || cached?.name || 'Comandante',
    characterId: player.characterId ?? cached?.characterId ?? null,
    characterSelected: player.characterSelected ?? cached?.characterSelected ?? false,
    hp: cached?.hp ?? 100,
    maxHp: cached?.maxHp ?? 100,
    lives: cached?.lives ?? (defaultLives === 'INFINITE' ? 999999 : defaultLives),
    maxLives: cached?.maxLives ?? (defaultLives === 'INFINITE' ? 999999 : defaultLives),
    score: cached?.score ?? 0,
    position: player.position || cached?.position || { x: 0, y: 440 },
    isReady: player.isReady ?? cached?.isReady ?? false
  } as OnlinePlayer;
}

function hydrateMatch(data: OnlineMatch, cached?: OnlineMatch | null): OnlineMatch {
  return {
    ...data,
    player1: hydratePlayer(
      data.player1,
      data.settings.lives,
      cached?.player1
    ),
    player2: data.player2
      ? hydratePlayer(data.player2, data.settings.lives, cached?.player2)
      : null
  };
}

/**
 * Create a temporary match in Realtime Database / Local Cache
 */
export async function createOnlineMatch(params: {
  creatorPlayerName: string;
  timeLimitSeconds: 300 | null;
  lives: GameLivesOption;
  islandId: string;
  isAiMatch?: boolean;
}): Promise<OnlineMatch> {
  const firebaseAuthenticated = await ensureFirebaseAuth();
  const { playerId } = getPlayerIdentity(params.creatorPlayerName);
  const authUid = firebaseAuthenticated ? auth?.currentUser?.uid : undefined;
  const matchId = `M_${Math.floor(100000 + Math.random() * 900000)}`;

  const player1: OnlinePlayer = {
    id: playerId,
    authUid,
    name: params.creatorPlayerName,
    characterId: null,
    characterSelected: false,
    hp: 100,
    maxHp: 100,
    lives: params.lives === 'INFINITE' ? 999999 : params.lives,
    maxLives: params.lives === 'INFINITE' ? 999999 : params.lives,
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
      lives: params.lives === 'INFINITE' ? 999999 : params.lives,
      maxLives: params.lives === 'INFINITE' ? 999999 : params.lives,
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

  // Active-match state is temporary realtime data, never written to Firestore.
  if (rtdb && isConfigured && authUid) {
    try {
      await set(ref(rtdb, `activeMatches/${matchId}`), {
        ...newMatch,
        player1: toPersistentPlayer(player1),
        player2: player2 ? toPersistentPlayer(player2) : null
      });
    } catch (e) {
      console.warn('Realtime Database create warning, falling back to local sync:', e);
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
  const firebaseAuthenticated = await ensureFirebaseAuth();
  const { playerId } = getPlayerIdentity(joinerPlayerName);
  const authUid = firebaseAuthenticated ? auth?.currentUser?.uid : undefined;

  if (rtdb && isConfigured && authUid) {
    try {
      const matchRef = ref(rtdb, `activeMatches/${matchId}`);
      let joinError = '';
      const result = await runTransaction(matchRef, (current) => {
        if (!current) {
          joinError = 'La partida ya no existe.';
          return;
        }
        const data = current as OnlineMatch;
        if (data.status !== 'waiting' || data.player2 !== null) {
          joinError = 'Esta partida ya está completa o ya ha comenzado.';
          return;
        }
        if (data.player1.id === playerId) {
          joinError = 'No puedes unirte como oponente a tu propia partida.';
          return;
        }
        const player2: OnlinePlayer = {
          id: playerId, authUid, name: joinerPlayerName,
          characterId: null, characterSelected: false,
          hp: 100, maxHp: 100,
          lives: data.settings.lives === 'INFINITE' ? 999999 : data.settings.lives,
          maxLives: data.settings.lives === 'INFINITE' ? 999999 : data.settings.lives,
          score: 0, position: { x: 1720, y: 440 }, isReady: false
        };
        return { ...data, player2: toPersistentPlayer(player2), status: 'starting', updatedAt: Date.now() };
      }, { applyLocally: false });
      if (!result.committed) throw new Error(joinError || 'No se pudo unir a la partida.');
      const merged = hydrateMatch(result.snapshot.val() as OnlineMatch);
      saveLocalMatch(merged);
      return merged;
    } catch (e) {
      console.warn('Realtime Database join failed, falling back to local memory:', e);
      if (e instanceof Error && /ya no existe|completa|propia partida/.test(e.message)) throw e;
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
    lives: match.settings.lives === 'INFINITE' ? 999999 : match.settings.lives,
    maxLives: match.settings.lives === 'INFINITE' ? 999999 : match.settings.lives,
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
  if (rtdb && isConfigured && await ensureFirebaseAuth()) {
    try {
      const matchRef = ref(rtdb, `activeMatches/${matchId}`);
      let selectionError = '';
      const result = await runTransaction(matchRef, (current) => {
        if (!current) {
          selectionError = 'Partida no encontrada';
          return;
        }
        const remoteMatch = current as OnlineMatch;
        const cachedMatch = getLocalMatches().find(m => m.matchId === matchId) || null;
        const match = hydrateMatch(remoteMatch, cachedMatch);
        const isP1 = match.player1.id === playerId;
        const isP2 = match.player2?.id === playerId;
        if (!isP1 && !isP2) {
          selectionError = 'No perteneces a esta partida';
          return;
        }
        const rivalCharId = isP1 ? match.player2?.characterId : match.player1.characterId;
        if (rivalCharId && rivalCharId === characterId) {
          selectionError = '¡Ese personaje ya fue elegido por tu rival! Selecciona otro.';
          return;
        }
        if (isP1) {
          match.player1.characterId = characterId;
          match.player1.characterSelected = true;
        } else if (match.player2) {
          match.player2.characterId = characterId;
          match.player2.characterSelected = true;
        }
        const p1Ready = match.player1.characterSelected;
        const p2Ready = match.player2 ? match.player2.characterSelected : false;
        if (p1Ready && p2Ready) {
          match.status = 'playing';
          match.gameState.matchStartedAt = Date.now();
          match.gameState.turnStartedAt = Date.now();
          if (match.settings.timeLimit) match.gameState.matchEndAt = Date.now() + match.settings.timeLimit * 1000;
        }
        match.updatedAt = Date.now();
        return {
          ...match,
          player1: toPersistentPlayer(match.player1),
          player2: match.player2 ? toPersistentPlayer(match.player2) : null
        };
      }, { applyLocally: false });
      if (!result.committed) throw new Error(selectionError || 'No se pudo seleccionar el personaje.');
      const updatedMatch = hydrateMatch(result.snapshot.val() as OnlineMatch, getLocalMatches().find(m => m.matchId === matchId));
      saveLocalMatch(updatedMatch);
      trackCharacterPick(characterId);
      return updatedMatch;
    } catch (e) {
      console.warn('Realtime Database selectCharacter error, fallback to local:', e);
      if (e instanceof Error && /Partida no encontrada|No perteneces|ya fue elegido/.test(e.message)) throw e;
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
  let unsubscribeRealtime: (() => void) | null = null;
  if (rtdb && isConfigured) {
    try {
      unsubscribeRealtime = onValue(ref(rtdb, `activeMatches/${matchId}`), (snapshot) => {
        if (snapshot.exists()) {
          const remote = snapshot.val() as OnlineMatch;
          const cached = getLocalMatches().find(m => m.matchId === matchId) || null;
          const match = hydrateMatch(remote, cached);
          saveLocalMatch(match);
          callback(match);
        } else {
          callback(null);
        }
      }, (err) => console.warn('Realtime Database match subscription error:', err));
    } catch (e) {
      console.warn('Failed to subscribe to realtime match:', e);
    }
  }
  const channelListener = (e: MessageEvent) => {
    if (e.data && e.data.matchId === matchId) callback(e.data.match);
  };
  if (localChannel) localChannel.addEventListener('message', channelListener);
  const initial = getLocalMatches().find(m => m.matchId === matchId);
  if (initial) callback(initial);
  return () => {
    if (unsubscribeRealtime) unsubscribeRealtime();
    if (localChannel) localChannel.removeEventListener('message', channelListener);
  };
}

/**
 * List available rooms waiting for an opponent
 */
export function subscribeToAvailableMatches(
  callback: (matches: OnlineMatch[]) => void
): () => void {
  let unsubscribeRealtime: (() => void) | null = null;
  if (rtdb && isConfigured) {
    try {
      unsubscribeRealtime = onValue(ref(rtdb, 'activeMatches'), (snapshot) => {
        const matches: OnlineMatch[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const match = child.val() as OnlineMatch;
            if (match.status === 'waiting' && !match.player2) matches.push(hydrateMatch(match));
          });
        }
        callback(matches);
      }, (err) => {
        console.warn('Realtime Database available matches error:', err);
        callback(getLocalMatches().filter(m => m.status === 'waiting'));
      });
    } catch (e) {
      console.warn('Failed to subscribe to realtime matches:', e);
      callback(getLocalMatches().filter(m => m.status === 'waiting'));
    }
  } else {
    callback(getLocalMatches().filter(m => m.status === 'waiting'));
  }
  const channelListener = () => callback(getLocalMatches().filter(m => m.status === 'waiting'));
  if (localChannel) localChannel.addEventListener('message', channelListener);
  return () => {
    if (unsubscribeRealtime) unsubscribeRealtime();
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

  if (rtdb && isConfigured && await ensureFirebaseAuth()) {
    try {
      await update(ref(rtdb, `activeMatches/${params.matchId}`), {
        'gameState/lastShot': shotEvent,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn('Realtime Database sendShot error:', e);
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

  if (rtdb && isConfigured && await ensureFirebaseAuth()) {
    try {
      await update(ref(rtdb, `activeMatches/${params.matchId}`), {
        'gameState/lastImpact': impactEvent,
        updatedAt: Date.now()
      });
    } catch (e) {
      // Local state was already updated; realtime sync failure must not freeze the HUD.
      console.warn('Realtime Database registerImpact error:', e);
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

  if (rtdb && isConfigured && await ensureFirebaseAuth()) {
    try {
      await update(ref(rtdb, `activeMatches/${matchId}`), {
        'gameState/currentTurnPlayerId': updatePayload['gameState.currentTurnPlayerId'],
        'gameState/turnStartedAt': local?.gameState.turnStartedAt || updatePayload['gameState.turnStartedAt'],
        'gameState/wind/speed': newWindSpeed,
        'gameState/wind/direction': newWindDirection,
        updatedAt: updatePayload.updatedAt
      });
    } catch (e) {
      console.warn('Realtime Database changeTurn error:', e);
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
  // Firestore is never used for live match state. Realtime Database temporarily
  // arbitrates the finish so both clients cannot count the same result twice.
  const localBeforeFinish = getLocalMatches().find(m => m.matchId === params.matchId) || null;
  if (localBeforeFinish?.gameState.processedForRanking) return localBeforeFinish;

  let finalMatch: OnlineMatch | null = localBeforeFinish;
  let finishClaimed = !rtdb || !isConfigured;

  if (rtdb && isConfigured && await ensureFirebaseAuth()) {
    try {
      const matchRef = ref(rtdb, `activeMatches/${params.matchId}`);
      const result = await runTransaction(matchRef, (current) => {
        if (!current) return;
        const match = current as OnlineMatch;
        if (match.status === 'finished' || match.gameState.processedForRanking) return;
        match.status = 'finished';
        match.gameState.winnerPlayerId = params.winnerPlayerId;
        match.gameState.loserPlayerId = params.loserPlayerId;
        match.gameState.finishReason = params.reason;
        match.gameState.finishedAt = Date.now();
        match.gameState.processedForRanking = true;
        match.updatedAt = Date.now();
        return {
          ...match,
          player1: toPersistentPlayer(match.player1),
          player2: match.player2 ? toPersistentPlayer(match.player2) : null
        };
      }, { applyLocally: false });
      finishClaimed = result.committed;
      if (result.snapshot.exists()) {
        finalMatch = hydrateMatch(result.snapshot.val() as OnlineMatch, localBeforeFinish);
      }
      // Finished room data is temporary and removed after clients have time to show results.
      if (result.committed) {
        setTimeout(() => {
          void remove(matchRef).catch((e) => console.warn('Temporary match cleanup failed:', e));
        }, 120000);
      }
    } catch (e) {
      console.warn('Realtime Database concludeMatch error, handling locally:', e);
    }
  }

  // Always finalize the local cache as well; remote match state is temporary.
  // Without this local transition the result modal/ranking can remain stuck.
  const local = getLocalMatches().find(m => m.matchId === params.matchId);
  if (!local) return finalMatch;

  if (local.status !== 'finished' && !local.gameState.processedForRanking) {
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
  }

  finalMatch = local;

  // Persist only the final ranking statistics to Firestore. Realtime Database's
  // finished flag prevents both clients from counting the same result.
  if (finalMatch && finalMatch.gameState.processedForRanking && finishClaimed) {
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
      trackRoomAbandoned(loser?.name || 'Rival', winner?.name || 'Jugador');
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
