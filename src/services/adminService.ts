import { AdminMetrics, CharacterId } from '../types/game';

const ADMIN_METRICS_KEY = 'fbi_admin_metrics';

const INITIAL_METRICS: AdminMetrics = {
  totalRoomsCreated: 142,
  totalRoomsCompleted: 118,
  totalRoomsAbandoned: 24,
  totalMatches: 142,
  totalPlayers: 86,
  characterPicks: {
    mono: 46,
    tortuga: 52,
    gallina: 34,
    panda: 58,
    conejo: 38,
    mapache: 42
  },
  characterWins: {
    mono: 24,
    tortuga: 31,
    gallina: 18,
    panda: 35,
    conejo: 19,
    mapache: 21
  },
  recentActivity: [
    { id: '1', timestamp: Date.now() - 3600000 * 2, type: 'completed', detail: 'Partida finalizada: MONO vs TORTUGA (Victoria Tortuga)' },
    { id: '2', timestamp: Date.now() - 3600000 * 4, type: 'abandoned', detail: 'Partida abandonada por P1: Derrota automática aplicada' },
    { id: '3', timestamp: Date.now() - 3600000 * 6, type: 'created', detail: 'Sala creada: "Batalla Playa 3V" por Juan' },
    { id: '4', timestamp: Date.now() - 3600000 * 12, type: 'completed', detail: 'Partida finalizada: PANDA vs GALLINA (Victoria Panda)' }
  ]
};

export function getAdminMetrics(): AdminMetrics {
  try {
    const raw = localStorage.getItem(ADMIN_METRICS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_METRICS_KEY, JSON.stringify(INITIAL_METRICS));
      return INITIAL_METRICS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_METRICS;
  }
}

export function trackRoomCreated(roomName: string = 'Partida Táctica', creator: string = 'Comandante') {
  const metrics = getAdminMetrics();
  metrics.totalRoomsCreated += 1;
  metrics.totalMatches += 1;
  metrics.recentActivity.unshift({
    id: String(Date.now()),
    timestamp: Date.now(),
    type: 'created',
    detail: `Sala "${roomName}" creada por ${creator}`
  });
  if (metrics.recentActivity.length > 25) metrics.recentActivity.pop();
  saveMetrics(metrics);
}

export function trackRoomCompleted(winnerCharacter?: CharacterId | null, loserCharacter?: CharacterId | null) {
  const metrics = getAdminMetrics();
  metrics.totalRoomsCompleted += 1;
  if (winnerCharacter) {
    metrics.characterWins[winnerCharacter] = (metrics.characterWins[winnerCharacter] || 0) + 1;
  }
  metrics.recentActivity.unshift({
    id: String(Date.now()),
    timestamp: Date.now(),
    type: 'completed',
    detail: `Partida completada: Ganador ${winnerCharacter ? winnerCharacter.toUpperCase() : 'N/A'}`
  });
  if (metrics.recentActivity.length > 25) metrics.recentActivity.pop();
  saveMetrics(metrics);
}

export function trackRoomAbandoned(leaverName: string = 'Rival', winnerName: string = 'Comandante') {
  const metrics = getAdminMetrics();
  metrics.totalRoomsAbandoned += 1;
  metrics.recentActivity.unshift({
    id: String(Date.now()),
    timestamp: Date.now(),
    type: 'abandoned',
    detail: `Abandono de ${leaverName}. Victoria automática otorgada a ${winnerName}.`
  });
  if (metrics.recentActivity.length > 25) metrics.recentActivity.pop();
  saveMetrics(metrics);
}

export function trackCharacterPick(characterId: CharacterId) {
  const metrics = getAdminMetrics();
  metrics.characterPicks[characterId] = (metrics.characterPicks[characterId] || 0) + 1;
  saveMetrics(metrics);
}

function saveMetrics(metrics: AdminMetrics) {
  try {
    localStorage.setItem(ADMIN_METRICS_KEY, JSON.stringify(metrics));
  } catch (e) {
    console.error('Error saving admin metrics:', e);
  }
}
