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
  { playerName: 'Capitán Coco', score: 3840, victories: 48, defeats: 6, lastPlayedAt: '2026-10-07' },
  { playerName: 'Isla Feroz', score: 3250, victories: 41, defeats: 9, lastPlayedAt: '2026-10-07' },
  { playerName: 'Mortero Pro', score: 2980, victories: 37, defeats: 12, lastPlayedAt: '2026-10-06' },
  { playerName: 'Bananazooka', score: 2710, victories: 34, defeats: 14, lastPlayedAt: '2026-10-06' },
  { playerName: 'Tortuga Blindada', score: 2540, victories: 31, defeats: 11, lastPlayedAt: '2026-10-05' },
  { playerName: 'Gallo Loco', score: 2390, victories: 29, defeats: 15, lastPlayedAt: '2026-10-05' },
  { playerName: 'Bambú Strike', score: 2210, victories: 27, defeats: 13, lastPlayedAt: '2026-10-04' },
  { playerName: 'Conejo Veloz', score: 2050, victories: 25, defeats: 18, lastPlayedAt: '2026-10-04' },
  { playerName: 'Mapache Táctico', score: 1920, victories: 23, defeats: 16, lastPlayedAt: '2026-10-03' },
  { playerName: 'Tirador Tropical', score: 1840, victories: 22, defeats: 19, lastPlayedAt: '2026-10-03' },
  { playerName: 'Cañón Playero', score: 1720, victories: 20, defeats: 14, lastPlayedAt: '2026-10-02' },
  { playerName: 'Arrecife Master', score: 1580, victories: 18, defeats: 12, lastPlayedAt: '2026-10-01' }
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
    return sortRankings(parsed);
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
  const cleanName = playerName.trim() || 'Comandante';
  const docId = cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  let currentRecord: PlayerRanking = {
    playerName: cleanName,
    score: earnedPoints,
    victories: isVictory ? 1 : 0,
    defeats: isVictory ? 0 : 1,
    lastPlayedAt: new Date().toISOString().split('T')[0]
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
          lastPlayedAt: new Date().toISOString().split('T')[0]
        };
      }

      // Persist only players who belong to the global Top 50.
      // The ranking collection is not a match-history collection.
      const topQuery = query(
        collection(db, 'ranking'),
        orderBy('score', 'desc'),
        limit(50)
      );
      const topSnapshot = await getDocs(topQuery);
      const topRecords = topSnapshot.docs.map(item => item.data() as PlayerRanking);
      const alreadyRanked = topRecords.some(
        item => item.playerName.toLowerCase() === cleanName.toLowerCase()
      );
      const cutoff = topRecords.length < 50
        ? 0
        : Math.min(...topRecords.map(item => item.score || 0));

      if (alreadyRanked || currentRecord.score >= cutoff || topRecords.length < 50) {
        await setDoc(docRef, currentRecord, { merge: true });
      }
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
      lastPlayedAt: new Date().toISOString().split('T')[0]
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
    defeats: isVictory ? 0 : 1
  };
}
