import { IslandConfig } from '../types/game';

export const ISLANDS: IslandConfig[] = [
  {
    id: 'isla_1',
    number: 1,
    name: 'Playa Tranquila',
    title: 'ISLA 1',
    subtitle: 'PLAYA TRANQUILA',
    totalColumns: 32,
    maxHeight: 5,
    leftIsland: {
      startCol: 2,
      endCol: 13,
      spawnCol: 4,
      blocks: [
        { col: 2, height: 1 },
        { col: 3, height: 2, decoration: 'palm' },
        { col: 4, height: 3, decoration: 'crate' },
        { col: 5, height: 2 },
        { col: 6, height: 2 },
        { col: 7, height: 1 },
        { col: 8, height: 1 },
        { col: 9, height: 2 },
        { col: 10, height: 2, decoration: 'crate' },
        { col: 11, height: 1 },
        { col: 12, height: 1 }
      ]
    },
    rightIsland: {
      startCol: 20,
      endCol: 31,
      spawnCol: 27,
      blocks: [
        { col: 20, height: 1 },
        { col: 21, height: 1 },
        { col: 22, height: 2 },
        { col: 23, height: 3, decoration: 'crate' },
        { col: 24, height: 2 },
        { col: 25, height: 2 },
        { col: 26, height: 1 },
        { col: 27, height: 2, decoration: 'palm' },
        { col: 28, height: 3, decoration: 'crate' },
        { col: 29, height: 2 },
        { col: 30, height: 1 }
      ]
    }
  },
  {
    id: 'isla_2',
    number: 2,
    name: 'Costa Rocosa',
    title: 'ISLA 2',
    subtitle: 'COSTA ROCOSA',
    totalColumns: 32,
    maxHeight: 5,
    leftIsland: {
      startCol: 3,
      endCol: 14,
      spawnCol: 5,
      blocks: [
        { col: 3, height: 1 },
        { col: 4, height: 2 },
        { col: 5, height: 3, decoration: 'crate' },
        { col: 6, height: 3 },
        { col: 7, height: 2 },
        { col: 8, height: 2, decoration: 'crate' },
        { col: 9, height: 1 },
        { col: 10, height: 1 },
        { col: 13, height: 1 }
      ]
    },
    rightIsland: {
      startCol: 20,
      endCol: 30,
      spawnCol: 26,
      blocks: [
        { col: 20, height: 1 },
        { col: 21, height: 2 },
        { col: 22, height: 2, decoration: 'crate' },
        { col: 23, height: 2 },
        { col: 24, height: 2 },
        { col: 25, height: 3, decoration: 'crate' },
        { col: 26, height: 3 },
        { col: 27, height: 1 },
        { col: 28, height: 1 },
        { col: 29, height: 1 }
      ]
    }
  },
  {
    id: 'isla_3',
    number: 3,
    name: 'Bahía Abierta',
    title: 'ISLA 3',
    subtitle: 'BAHÍA ABIERTA',
    totalColumns: 32,
    maxHeight: 5,
    leftIsland: {
      startCol: 2,
      endCol: 14,
      spawnCol: 5,
      blocks: [
        { col: 2, height: 1 },
        { col: 3, height: 2 },
        { col: 4, height: 2, decoration: 'crate' },
        { col: 5, height: 2 },
        { col: 6, height: 1 },
        { col: 7, height: 1 },
        { col: 8, height: 2, decoration: 'hut' },
        { col: 9, height: 2 },
        { col: 10, height: 1, decoration: 'crate' },
        { col: 11, height: 1 },
        { col: 12, height: 1 }
      ]
    },
    rightIsland: {
      startCol: 21,
      endCol: 31,
      spawnCol: 28,
      blocks: [
        { col: 21, height: 1 },
        { col: 22, height: 1 },
        { col: 23, height: 1 },
        { col: 24, height: 1 },
        { col: 25, height: 2 },
        { col: 26, height: 2, decoration: 'crate' },
        { col: 27, height: 3 },
        { col: 28, height: 2, decoration: 'palm' },
        { col: 29, height: 1 },
        { col: 30, height: 1 }
      ]
    }
  },
  {
    id: 'isla_4',
    number: 4,
    name: 'Arrecife Bajo',
    title: 'ISLA 4',
    subtitle: 'ARRECIFE BAJO',
    totalColumns: 32,
    maxHeight: 5,
    leftIsland: {
      startCol: 2,
      endCol: 13,
      spawnCol: 4,
      blocks: [
        { col: 2, height: 1 },
        { col: 3, height: 2 },
        { col: 4, height: 2, decoration: 'crate' },
        { col: 5, height: 2 },
        { col: 6, height: 2 },
        { col: 7, height: 1 },
        { col: 8, height: 1 },
        { col: 9, height: 2 },
        { col: 10, height: 1 },
        { col: 11, height: 1, decoration: 'crate' }
      ]
    },
    rightIsland: {
      startCol: 21,
      endCol: 31,
      spawnCol: 27,
      blocks: [
        { col: 21, height: 1 },
        { col: 22, height: 1, decoration: 'crate' },
        { col: 23, height: 1 },
        { col: 24, height: 1 },
        { col: 25, height: 1 },
        { col: 26, height: 2 },
        { col: 27, height: 2 },
        { col: 28, height: 1 },
        { col: 29, height: 2, decoration: 'crate' },
        { col: 30, height: 1 }
      ]
    }
  }
];

export function getIslandById(id: string): IslandConfig {
  return ISLANDS.find(i => i.id === id) || ISLANDS[0];
}
