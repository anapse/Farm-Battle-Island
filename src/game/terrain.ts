import { TerrainBlock, SceneryObject } from './types';
import { WorldConfig } from './world';

export interface IslandMold {
  id: string;
  name: string;
  // Heights (in blocks, from 2 to 7) for 20 columns
  columnHeights: number[];
  scenery: { colIndex: number; type: 'palm' | 'crate' | 'hut' | 'rock' }[];
  playerSpawnColIndex: number;
}

export const ISLAND_MOLDS: IslandMold[] = [
  // Mold 1: Playa Tranquila
  {
    id: 'isla_1',
    name: 'Playa Tranquila',
    columnHeights: [
      1, 2, 3, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 1, 1, 0, 0
    ],
    scenery: [
      { colIndex: 2, type: 'palm' },
      { colIndex: 4, type: 'crate' },
      { colIndex: 7, type: 'rock' },
      { colIndex: 11, type: 'crate' },
      { colIndex: 14, type: 'palm' }
    ],
    playerSpawnColIndex: 5
  },
  // Mold 2: Costa Rocosa
  {
    id: 'isla_2',
    name: 'Costa Rocosa',
    columnHeights: [
      2, 3, 5, 5, 4, 4, 4, 4, 3, 3, 4, 4, 3, 2, 2, 1, 1, 1, 0, 0
    ],
    scenery: [
      { colIndex: 3, type: 'rock' },
      { colIndex: 6, type: 'crate' },
      { colIndex: 10, type: 'rock' },
      { colIndex: 12, type: 'crate' },
      { colIndex: 15, type: 'palm' }
    ],
    playerSpawnColIndex: 6
  },
  // Mold 3: Bahía Abierta
  {
    id: 'isla_3',
    name: 'Bahía Abierta',
    columnHeights: [
      1, 2, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 0, 0, 0
    ],
    scenery: [
      { colIndex: 3, type: 'palm' },
      { colIndex: 7, type: 'hut' },
      { colIndex: 11, type: 'crate' },
      { colIndex: 14, type: 'rock' }
    ],
    playerSpawnColIndex: 4
  },
  // Mold 4: Arrecife Bajo
  {
    id: 'isla_4',
    name: 'Arrecife Bajo',
    columnHeights: [
      1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0
    ],
    scenery: [
      { colIndex: 2, type: 'rock' },
      { colIndex: 5, type: 'crate' },
      { colIndex: 8, type: 'palm' },
      { colIndex: 12, type: 'crate' },
      { colIndex: 15, type: 'rock' }
    ],
    playerSpawnColIndex: 5
  }
];

export class TerrainManager {
  public blocks: TerrainBlock[] = [];
  public sceneryObjects: SceneryObject[] = [];
  public currentMoldId: string = 'isla_1';

  constructor(moldId: string = 'isla_1') {
    this.buildWorld(moldId);
  }

  public buildWorld(moldId: string) {
    this.currentMoldId = moldId;
    this.blocks = [];
    this.sceneryObjects = [];

    const mold = ISLAND_MOLDS.find(m => m.id === moldId) || ISLAND_MOLDS[0];
    const bw = WorldConfig.BLOCK_WIDTH;
    const bh = WorldConfig.BLOCK_HEIGHT;
    const waterY = WorldConfig.WATER_Y;

    // 1. Build Left Island (Player 1)
    const leftStartCol = WorldConfig.LEFT_ISLAND_START_COL;
    for (let i = 0; i < mold.columnHeights.length; i++) {
      const col = leftStartCol + i;
      const heightInBlocks = mold.columnHeights[i];
      if (heightInBlocks <= 0) continue;

      for (let h = 1; h <= heightInBlocks; h++) {
        const blockY = waterY - h * bh;
        const blockX = col * bw;
        const blockId = `left_${col}_${h}`;
        const isTop = h === heightInBlocks;

        this.blocks.push({
          id: blockId,
          islandIndex: 1,
          col,
          heightLevel: h,
          x: blockX,
          y: blockY,
          width: bw,
          height: bh,
          health: 100,
          maxHealth: 100,
          isDestroyed: false,
          hasMoss: isTop
        });
      }
    }

    // Build Left Island Scenery Objects
    mold.scenery.forEach((sc, idx) => {
      const col = leftStartCol + sc.colIndex;
      const heightInBlocks = mold.columnHeights[sc.colIndex];
      if (heightInBlocks > 0) {
        const topBlockY = waterY - heightInBlocks * bh;
        const blockX = col * bw;
        const supportedBlockId = `left_${col}_${heightInBlocks}`;

        this.sceneryObjects.push({
          id: `scenery_left_${idx}`,
          type: sc.type,
          islandIndex: 1,
          x: blockX + bw * 0.5,
          y: topBlockY,
          width: sc.type === 'hut' ? 56 : (sc.type === 'crate' ? 26 : (sc.type === 'rock' ? 32 : 48)),
          height: sc.type === 'hut' ? 44 : (sc.type === 'crate' ? 26 : (sc.type === 'rock' ? 24 : 76)),
          supportedByBlockId: supportedBlockId,
          isDestroyed: false
        });
      }
    });

    // 2. Build Right Island (Player 2, Mirrored layout)
    const rightStartCol = WorldConfig.RIGHT_ISLAND_START_COL;
    for (let i = 0; i < mold.columnHeights.length; i++) {
      // Mirror columns from right to left
      const col = rightStartCol + (mold.columnHeights.length - 1 - i);
      const heightInBlocks = mold.columnHeights[i];
      if (heightInBlocks <= 0) continue;

      for (let h = 1; h <= heightInBlocks; h++) {
        const blockY = waterY - h * bh;
        const blockX = col * bw;
        const blockId = `right_${col}_${h}`;
        const isTop = h === heightInBlocks;

        this.blocks.push({
          id: blockId,
          islandIndex: 2,
          col,
          heightLevel: h,
          x: blockX,
          y: blockY,
          width: bw,
          height: bh,
          health: 100,
          maxHealth: 100,
          isDestroyed: false,
          hasMoss: isTop
        });
      }
    }

    // Build Right Island Scenery Objects
    mold.scenery.forEach((sc, idx) => {
      const col = rightStartCol + (mold.columnHeights.length - 1 - sc.colIndex);
      const heightInBlocks = mold.columnHeights[sc.colIndex];
      if (heightInBlocks > 0) {
        const topBlockY = waterY - heightInBlocks * bh;
        const blockX = col * bw;
        const supportedBlockId = `right_${col}_${heightInBlocks}`;

        this.sceneryObjects.push({
          id: `scenery_right_${idx}`,
          type: sc.type,
          islandIndex: 2,
          x: blockX + bw * 0.5,
          y: topBlockY,
          width: sc.type === 'hut' ? 56 : (sc.type === 'crate' ? 26 : (sc.type === 'rock' ? 32 : 48)),
          height: sc.type === 'hut' ? 44 : (sc.type === 'crate' ? 26 : (sc.type === 'rock' ? 24 : 76)),
          supportedByBlockId: supportedBlockId,
          isDestroyed: false
        });
      }
    });

    // 3. Build Submerged Safety Floor under water
    // A continuous submerged line of solid blocks at SAFETY_FLOOR_Y
    for (let col = 1; col < WorldConfig.TOTAL_COLUMNS - 1; col++) {
      this.blocks.push({
        id: `safety_${col}`,
        islandIndex: col < 28 ? 1 : 2,
        col,
        heightLevel: 0,
        x: col * bw,
        y: WorldConfig.SAFETY_FLOOR_Y,
        width: bw,
        height: bh,
        health: 99999, // indestructible safety bed
        maxHealth: 99999,
        isDestroyed: false,
        hasMoss: false
      });
    }
  }

  /**
   * Radial Terrain Block Destruction
   * Rule: Disparo normal destruye 2-3 bloques, fuerte 4-6, especial 6-8+
   * Destroys all blocks whose center is within radius.
   * If base block of an object is destroyed, the object disappears (LEGO rule).
   */
  public explodeAt(explosionX: number, explosionY: number, radius: number): {
    destroyedBlocksCount: number;
    destroyedBlocks: TerrainBlock[];
  } {
    const destroyedBlocks: TerrainBlock[] = [];

    // Find blocks within blast circle
    for (const b of this.blocks) {
      if (b.isDestroyed || b.heightLevel === 0) continue; // Safety floor is not destroyed

      const blockCenterX = b.x + b.width / 2;
      const blockCenterY = b.y + b.height / 2;
      const dist = Math.hypot(blockCenterX - explosionX, blockCenterY - explosionY);

      if (dist <= radius) {
        b.isDestroyed = true;
        destroyedBlocks.push(b);
      }
    }

    // LEGO Rule for Scenery Objects:
    // If the supporting block is destroyed, the object is immediately destroyed as well
    for (const obj of this.sceneryObjects) {
      if (obj.isDestroyed) continue;
      const supportingBlock = this.blocks.find(b => b.id === obj.supportedByBlockId);
      if (!supportingBlock || supportingBlock.isDestroyed) {
        obj.isDestroyed = true;
      }
    }

    // Update moss status: top non-destroyed block of each column receives moss
    this.refreshTopMoss();

    return {
      destroyedBlocksCount: destroyedBlocks.length,
      destroyedBlocks
    };
  }

  private refreshTopMoss() {
    const activeColumns = new Map<string, TerrainBlock>();

    for (const b of this.blocks) {
      if (b.isDestroyed || b.heightLevel === 0) continue;
      const key = `${b.islandIndex}_${b.col}`;
      const existing = activeColumns.get(key);
      if (!existing || b.y < existing.y) {
        activeColumns.set(key, b);
      }
    }

    // Reset moss and assign only to uppermost block
    for (const b of this.blocks) {
      if (b.heightLevel === 0) continue;
      b.hasMoss = false;
    }
    for (const topBlock of activeColumns.values()) {
      topBlock.hasMoss = true;
    }
  }

  /**
   * Get the spawn position (x, y) for Player 1 or Player 2
   */
  public getSpawnPosition(islandIndex: 1 | 2): { x: number; y: number } {
    const mold = ISLAND_MOLDS.find(m => m.id === this.currentMoldId) || ISLAND_MOLDS[0];
    const bw = WorldConfig.BLOCK_WIDTH;

    let col: number;
    if (islandIndex === 1) {
      col = WorldConfig.LEFT_ISLAND_START_COL + mold.playerSpawnColIndex;
    } else {
      col = WorldConfig.RIGHT_ISLAND_START_COL + (mold.columnHeights.length - 1 - mold.playerSpawnColIndex);
    }

    const groundY = this.getGroundYAt(col * bw + bw / 2);
    return {
      x: col * bw + bw / 2,
      y: groundY - 20
    };
  }

  /**
   * Raycast / Query highest solid block Y at given world X
   */
  public getGroundYAt(worldX: number): number {
    let highestSolidY = WorldConfig.DEATH_FLOOR_Y;

    for (const b of this.blocks) {
      if (b.isDestroyed) continue;
      if (worldX >= b.x && worldX <= b.x + b.width) {
        if (b.y < highestSolidY) {
          highestSolidY = b.y;
        }
      }
    }

    return highestSolidY;
  }

  /**
   * Render the modular blocks and scenery objects cleanly on Canvas.
   * Universal Block Concept: ROCA + TIERRA/ARENA + MUSGO VERDE CLARO
   * (NO AI SPRITES RULE APPLIED)
   */
  public render(ctx: CanvasRenderingContext2D) {
    // 1. Render all solid blocks
    for (const b of this.blocks) {
      if (b.isDestroyed) continue;
      this.renderBlock(ctx, b);
    }

    // 2. Render all intact scenery objects
    for (const obj of this.sceneryObjects) {
      if (obj.isDestroyed) continue;
      this.renderScenery(ctx, obj);
    }
  }

  private renderBlock(ctx: CanvasRenderingContext2D, b: TerrainBlock) {
    const { x, y, width, height, hasMoss, heightLevel } = b;

    // Safety floor under water
    if (heightLevel === 0) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
      return;
    }

    // Universal Block Concept:
    // Base: Heavy warm sandstone / Quarry rock
    ctx.fillStyle = '#D97706'; // Warm quarry stone
    ctx.fillRect(x, y, width, height);

    // Earth / Sand middle gradient band
    ctx.fillStyle = '#B45309';
    ctx.fillRect(x + 2, y + height * 0.4, width - 4, height * 0.5);

    // Beveled rock edges
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Stone chisel texture groove
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 10);
    ctx.lineTo(x + width - 8, y + 10);
    ctx.moveTo(x + 12, y + height - 12);
    ctx.lineTo(x + width - 12, y + height - 12);
    ctx.stroke();

    // Top: Lush Light Green Moss (Musgo verde claro)
    if (hasMoss) {
      ctx.fillStyle = '#22C55E'; // Lush tropical grass
      ctx.fillRect(x, y, width, 10);

      // Light moss fringe highlights
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(x + 2, y + 1, width - 4, 3);

      // Drooping moss tendrils
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(x + width * 0.3, y + 10, 4, 0, Math.PI);
      ctx.arc(x + width * 0.7, y + 10, 5, 0, Math.PI);
      ctx.fill();
    }
  }

  private renderScenery(ctx: CanvasRenderingContext2D, obj: SceneryObject) {
    const { x, y, type } = obj;

    if (type === 'crate') {
      const s = 24;
      const bx = x - s / 2;
      const by = y - s;
      ctx.fillStyle = '#B45309';
      ctx.fillRect(bx, by, s, s);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, s, s);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + s, by + s);
      ctx.moveTo(bx + s, by);
      ctx.lineTo(bx, by + s);
      ctx.stroke();
    } else if (type === 'rock') {
      const rw = 28;
      const rh = 18;
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.ellipse(x, y - rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (type === 'palm') {
      // Slanted organic palm trunk
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#92400E';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 12, y - 40, x + 8, y - 76);
      ctx.stroke();

      // Fronds
      ctx.fillStyle = '#15803D';
      const topX = x + 8;
      const topY = y - 76;
      for (let a = -0.9; a <= 0.9; a += 0.45) {
        ctx.beginPath();
        ctx.arc(topX + a * 24, topY - 12, 18, 0, Math.PI);
        ctx.fill();
      }
    } else if (type === 'hut') {
      // Beach hut
      const hw = 52;
      const hh = 34;
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x - hw / 2, y - hh, hw, hh);

      // Straw thatch roof
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.moveTo(x - hw / 2 - 8, y - hh);
      ctx.lineTo(x, y - hh - 24);
      ctx.lineTo(x + hw / 2 + 8, y - hh);
      ctx.closePath();
      ctx.fill();
    }
  }
}
