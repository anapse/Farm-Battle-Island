import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { PlayerRanking } from '../types/game';

const RANKING_STORAGE_KEY = 'fbi_top50_rankings';

// Seed initial leaderboard so Top 50 is lively and realistic
const DEFAULT_RANKINGS: PlayerRanking[] = [
  { playerName: 'Capitán Coco', score: 3840, victories: 48, defeats: 6, matchesPlayed: 54 },
  { playerName: 'Isla Feroz', score: 3250, victories: 41, defeats: 9, matchesPlayed: 50 },
  { playerName: 'Mortero Pro', score: 2980, victories: 37, defeats: 12, matchesPlayed: 49 },
  { playerName: 'Bananazooka', score: 2710, victories: 34, defeats: 14, matchesPlayed: 48 },
  { playerName: 'Tortuga Blindada', score: 2540, victories: 31, defeats: 11, matchesPlayed: 42 },
  { playerName: 'Gallo Loco', score: 2390, victories: 29, defeats: 15, matchesPlayed: 44 },
  { playerName: 'Bambú Strike', score: 2210, victories: 27, defeats: 13, matchesPlayed: 40 },
  { playerName: 'Conejo Veloz', score: 2050, victories: 25, defeats: 18, matchesPlayed: 43 },
  { playerName: 'Mapache Táctico', score: 1920, victories: 23, defeats: 16, matchesPlayed: 39 },
  { playerName: 'Tirador Tropical', score: 1840, victories: 22, defeats: 19, matchesPlayed: 41 },
  { playerName: 'Cañón Playero', score: 1720, victories: 20, defeats: 14, matchesPlayed: 34 },
  { playerName: 'Arrecife Master', score: 1580, victories: 18, defeats: 12, matchesPlayed: 30 }
];

/**
 * Sort rankings by:
 * 1. score DESC
 * 2. victories DESC (tie breaker)
 * 3. defeats ASC (tie breaker)
 */
export function sortRankings(list: PlayerRanking[]): PlayerRanking[] {
  return [...list].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.victories !== a.victories) return b.victories - a.victories;
    return a.defeats - b.defeats;
  });
}

/**
 * Synchronous local retrieval for instant UI renders
 */
export function getRankings(): PlayerRanking[] {
  try {
    const raw = localStorage.getItem(RANKING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(DEFAULT_RANKINGS));
      return sortRankings(DEFAULT_RANKINGS);
    }
    const parsed: PlayerRanking[] = JSON.parse(raw);
    return sortRankings(parsed.map((player) => ({
      ...player,
      matchesPlayed: player.matchesPlayed ?? ((player.victories || 0) + (player.defeats || 0))
    })));
  } catch {
    return sortRankings(DEFAULT_RANKINGS);
  }
}

/**
 * Fetch Top 50 from Firestore collection 'ranking'
 */
export async function fetchOnlineTop50(): Promise<PlayerRanking[]> {
  if (db && isConfigured) {
    try {
      const q = query(
        collection(db, 'ranking'),
        orderBy('score', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreList: PlayerRanking[] = [];
        snapshot.forEach(docSnap => {
          firestoreList.push(docSnap.data() as PlayerRanking);
        });
        const sorted = sortRankings(firestoreList);
        localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(sorted));
        return sorted;
      }
    } catch (e) {
      console.warn('Firestore ranking fetch failed, using local cache:', e);
    }
  }

  return getRankings();
}

/**
 * Record match ranking result in Firestore collection 'ranking'
 * RULE:
 * Winner: score += matchScore, victories += 1
 * Loser: score += matchScore (conserva sus puntos!), defeats += 1
 */
export async function recordMatchRankingResult(
  playerName: string, 
  earnedPoints: number, 
  isVictory: boolean
): Promise<PlayerRanking> {
  const cleanName = playerName.trim();
  if (cleanName.length < 2) throw new Error('El alias debe tener al menos 2 caracteres.');
  const docId = encodeURIComponent(cleanName.toLowerCase());

  let currentRecord: PlayerRanking = {
    playerName: cleanName,
    score: earnedPoints,
    victories: isVictory ? 1 : 0,
    defeats: isVictory ? 0 : 1,
    matchesPlayed: 1
  };

  if (db && isConfigured) {
    try {
      const docRef = doc(db, 'ranking', docId);
      const snap = await getDoc(docRef);
      const previous = snap.exists() ? (snap.data() as PlayerRanking) : null;

      if (previous) {
        currentRecord = {
          playerName: cleanName,
          score: Math.max(0, (previous.score || 0) + earnedPoints),
          victories: (previous.victories || 0) + (isVictory ? 1 : 0),
          defeats: (previous.defeats || 0) + (isVictory ? 0 : 1),
          matchesPlayed: (previous.matchesPlayed ?? ((previous.victories || 0) + (previous.defeats || 0))) + 1
        };
      }

      // Keep one compact aggregate per chosen alias, even when it is not in the Top 50.
      // No match document or gameplay data is stored in Firestore.
      await setDoc(docRef, currentRecord);
    } catch (e) {
      console.warn('Firestore ranking record error, saving locally:', e);
    }
  }

  // Also update local cache
  const localList = getRankings();
  const existingIdx = localList.findIndex(p => p.playerName.toLowerCase() === cleanName.toLowerCase());
  if (existingIdx >= 0) {
    localList[existingIdx] = {
      ...localList[existingIdx],
      score: Math.max(0, localList[existingIdx].score + earnedPoints),
      victories: localList[existingIdx].victories + (isVictory ? 1 : 0),
      defeats: localList[existingIdx].defeats + (isVictory ? 0 : 1),
      matchesPlayed: (localList[existingIdx].matchesPlayed ?? (localList[existingIdx].victories + localList[existingIdx].defeats)) + 1
    };
    currentRecord = localList[existingIdx];
  } else {
    localList.push(currentRecord);
  }

  const sortedTop50 = sortRankings(localList).slice(0, 50);
  try {
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(sortedTop50));
  } catch (e) {
    console.warn(e);
  }

  return currentRecord;
}

export function recordMatchResult(playerName: string, isVictory: boolean, earnedPoints: number): PlayerRanking {
  // Sync wrapper
  recordMatchRankingResult(playerName, earnedPoints, isVictory);
  return getRankings().find(p => p.playerName.toLowerCase() === playerName.toLowerCase()) || {
    playerName,
    score: earnedPoints,
    victories: isVictory ? 1 : 0,
    defeats: isVictory ? 0 : 1,
    matchesPlayed: 1
  };
}
