import { TerrainBlock, PlayerEntity, ProjectileEntity } from './types';
import { WorldConfig } from './world';

export interface CollisionResult {
  hit: boolean;
  type: 'none' | 'terrain' | 'water' | 'player';
  hitX: number;
  hitY: number;
  hitBlock?: TerrainBlock;
  hitPlayer?: PlayerEntity;
}

export class CollisionSystem {
  /**
   * Check collision of a projectile against terrain, water, or opposing player
   */
  public static checkProjectileCollision(
    projectile: ProjectileEntity,
    blocks: TerrainBlock[],
    players: PlayerEntity[]
  ): CollisionResult {
    const { x, y, radius, shooterRole } = projectile;

    // 1. Water collision
    if (y >= WorldConfig.WATER_Y) {
      return {
        hit: true,
        type: 'water',
        hitX: x,
        hitY: WorldConfig.WATER_Y
      };
    }

    // 2. Opposing player collision
    for (const player of players) {
      if (player.role === shooterRole) continue;
      if (player.lifeState !== 'active') continue; // Don't hit dead or invulnerable respawning player

      // Bounding box / circle distance to vehicle center
      const pCenterX = player.x;
      const pCenterY = player.y - 14;
      const dist = Math.hypot(x - pCenterX, y - pCenterY);

      if (dist <= radius + 22) {
        return {
          hit: true,
          type: 'player',
          hitX: x,
          hitY: y,
          hitPlayer: player
        };
      }
    }

    // 3. Terrain block collision
    for (const b of blocks) {
      if (b.isDestroyed) continue;

      // Circle vs AABB collision
      const closestX = Math.max(b.x, Math.min(x, b.x + b.width));
      const closestY = Math.max(b.y, Math.min(y, b.y + b.height));

      const dx = x - closestX;
      const dy = y - closestY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared <= radius * radius) {
        return {
          hit: true,
          type: 'terrain',
          hitX: closestX,
          hitY: closestY,
          hitBlock: b
        };
      }
    }

    return {
      hit: false,
      type: 'none',
      hitX: x,
      hitY: y
    };
  }

  /**
   * Calculate terrain slope at player position for vehicle tilting
   */
  public static calculateGroundTilt(
    worldX: number,
    getGroundY: (x: number) => number
  ): number {
    const probeOffset = 18;
    const leftY = getGroundY(worldX - probeOffset);
    const rightY = getGroundY(worldX + probeOffset);

    // Limit maximum tilt to ~28 degrees for stability
    const rawAngle = Math.atan2(rightY - leftY, probeOffset * 2);
    const maxAngle = (28 * Math.PI) / 180;
    return Math.max(-maxAngle, Math.min(maxAngle, rawAngle));
  }

  /**
   * Check if player can step to newX without hitting a steep vertical wall
   */
  public static canPlayerMoveTo(
    currentX: number,
    currentY: number,
    targetX: number,
    blocks: TerrainBlock[]
  ): boolean {
    const maxClimbHeight = WorldConfig.BLOCK_HEIGHT * 1.25;

    for (const b of blocks) {
      if (b.isDestroyed || b.heightLevel === 0) continue;

      if (targetX >= b.x && targetX <= b.x + b.width) {
        // If block top is too high above current ground level, it's a solid blocking wall
        const blockTopY = b.y;
        if (currentY - blockTopY > maxClimbHeight) {
          return false;
        }
      }
    }

    return true;
  }
}
