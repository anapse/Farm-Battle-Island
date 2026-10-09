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
    const previousX = projectile.previousX ?? x;
    const previousY = projectile.previousY ?? y;

    // 1. Water collision
    if (y >= WorldConfig.WATER_Y) {
      return {
        hit: true,
        type: 'water',
        hitX: x,
        hitY: WorldConfig.WATER_Y
      };
    }

    // 2. Opposing player collision.
    // Use a tall hitbox from the character's head to its feet, and sweep
    // the projectile segment through it so fast shots cannot pass between frames.
    for (const player of players) {
      if (player.role === shooterRole) continue;
      if (player.lifeState !== 'active') continue;

      // player.y is the ground anchor; the rendered character extends upward.
      // Expand the hitbox by projectile radius so the missile itself can touch it.
      const hitbox = {
        minX: player.x - 48 - radius,
        maxX: player.x + 48 + radius,
        minY: player.y - 184 - radius,
        maxY: player.y + 8 + radius
      };
      const dx = x - previousX;
      const dy = y - previousY;
      let t0 = 0;
      let t1 = 1;
      const clip = (p: number, q: number): boolean => {
        if (Math.abs(p) < 1e-9) return q >= 0;
        const t = q / p;
        if (p < 0) {
          if (t > t1) return false;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return false;
          if (t < t1) t1 = t;
        }
        return true;
      };

      const intersects = clip(-dx, previousX - hitbox.minX) &&
        clip(dx, hitbox.maxX - previousX) &&
        clip(-dy, previousY - hitbox.minY) &&
        clip(dy, hitbox.maxY - previousY);

      if (intersects) {
        const hitX = previousX + t0 * dx;
        const hitY = previousY + t0 * dy;
        return {
          hit: true,
          type: 'player',
          hitX,
          hitY,
          hitPlayer: player
        };
      }
    }

    // 3. Terrain block collision. A grenade that is already rolling
    // follows the terrain surface; it must not immediately collide again.
    if (projectile.grenadeRolling) {
      return {
        hit: false,
        type: 'none',
        hitX: x,
        hitY: y
      };
    }

    for (const b of blocks) {
      if (b.isDestroyed) continue;

      // Swept circle vs AABB: checks the whole movement segment,
      // preventing fast projectiles from tunneling through thin terrain gaps.
      const minX = b.x - radius;
      const maxX = b.x + b.width + radius;
      const minY = b.y - radius;
      const maxY = b.y + b.height + radius;

      const segmentIntersects = (
        x1: number, y1: number, x2: number, y2: number
      ): boolean => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        let t0 = 0;
        let t1 = 1;
        const clip = (p: number, q: number): boolean => {
          if (Math.abs(p) < 1e-9) return q >= 0;
          const r = q / p;
          if (p < 0) {
            if (r > t1) return false;
            if (r > t0) t0 = r;
          } else {
            if (r < t0) return false;
            if (r < t1) t1 = r;
          }
          return true;
        };
        return clip(-dx, x1 - minX) &&
          clip(dx, maxX - x1) &&
          clip(-dy, y1 - minY) &&
          clip(dy, maxY - y1);
      };

      if (segmentIntersects(previousX, previousY, x, y)) {
        return {
          hit: true,
          type: 'terrain',
          hitX: x,
          hitY: y,
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
