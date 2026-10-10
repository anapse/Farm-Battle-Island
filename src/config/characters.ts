import { CharacterStats } from '../types/game';

export const CHARACTERS: CharacterStats[] = [
  {
    id: 'mono',
    name: 'MONO',
    fuerza: 88,
    resistencia: 62,
    minAngle: 12,
    maxAngle: 80,
    badgeSymbol: '🍌',
    themeColor: '#EF4444', // Red
    accentColor: '#F87171',
    tankColor: '#B91C1C',
    barrelColor: '#7F1D1D',
    specialTrait: 'Artillería ofensiva: gran potencia de fuego, blindaje ligero'
  },
  {
    id: 'tortuga',
    name: 'TORTUGA',
    fuerza: 68,
    resistencia: 96,
    minAngle: 10,
    maxAngle: 78,
    badgeSymbol: '🛡️',
    themeColor: '#10B981', // Emerald / Army Green
    accentColor: '#34D399',
    tankColor: '#047857',
    barrelColor: '#064E3B',
    specialTrait: 'Blindaje acorazado supremo con máxima absorción de impacto'
  },
  {
    id: 'gallina',
    name: 'GALLINA',
    fuerza: 76,
    resistencia: 72,
    minAngle: 15,
    maxAngle: 82,
    badgeSymbol: '🐔',
    themeColor: '#F59E0B', // Amber / Gold
    accentColor: '#FBBF24',
    tankColor: '#D97706',
    barrelColor: '#92400E',
    specialTrait: 'Lanzamiento de proyectiles en ángulo vertical extendido'
  },
  {
    id: 'panda',
    name: 'PANDA',
    fuerza: 94,
    resistencia: 68,
    minAngle: 11,
    maxAngle: 76,
    badgeSymbol: '🎋',
    themeColor: '#059669', // Forest Green
    accentColor: '#10B981',
    tankColor: '#065F46',
    barrelColor: '#022C22',
    specialTrait: 'Cañón devastador: máximo daño, pero poca resistencia'
  },
  {
    id: 'conejo',
    name: 'CONEJO',
    fuerza: 66,
    resistencia: 64,
    minAngle: 14,
    maxAngle: 81,
    badgeSymbol: '🥕',
    themeColor: '#3B82F6', // Blue
    accentColor: '#60A5FA',
    tankColor: '#1D4ED8',
    barrelColor: '#1E3A8A',
    specialTrait: 'Chasis aerodinámico con apuntado ágil y rango adaptable'
  },
  {
    id: 'mapache',
    name: 'MAPACHE',
    fuerza: 78,
    resistencia: 80,
    minAngle: 13,
    maxAngle: 79,
    badgeSymbol: '🐾',
    themeColor: '#8B5CF6', // Purple / Tactical
    accentColor: '#A78BFA',
    tankColor: '#6D28D9',
    barrelColor: '#4C1D95',
    specialTrait: 'Mortero táctico balanceado con metralla dispersa'
  }
];

export function getCharacterById(id: string): CharacterStats {
  const found = CHARACTERS.find(c => c.id === id);
  return found || CHARACTERS[0];
}
