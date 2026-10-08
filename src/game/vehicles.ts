import { PlayerEntity } from './types';
import { getCharacterById } from '../config/characters';

export class VehicleRenderer {
  /**
   * Render farm-improvised vehicle with rotating wheels, slope tilt, idle vibration,
   * cannon angular rotation, and character mascot badge.
   * (NO AI SPRITES RULE ENFORCED)
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    isActiveTurn: boolean
  ) {
    const char = getCharacterById(player.characterId);
    const facing = player.facing;

    ctx.save();

    // Invulnerability flashing or death fade
    if (player.lifeState === 'invulnerable') {
      ctx.globalAlpha = Math.sin(Date.now() * 0.015) > 0 ? 0.4 : 0.9;
    } else {
      ctx.globalAlpha = player.alpha;
    }

    // Translate to vehicle ground anchor
    ctx.translate(player.x, player.y);

    // Idle vibration (sin/cos subtle engine hum when vehicle is stopped)
    const idleOscillation = Math.sin(player.idleTimer * 12) * 1.5;
    const idleRoll = Math.cos(player.idleTimer * 8) * 0.02;

    // Apply ground slope tilt + idle oscillation
    ctx.rotate(player.tiltAngle + idleRoll);

    // Active Turn Glow Aura
    if (isActiveTurn && player.lifeState === 'active') {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, -18 + idleOscillation, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Active Shield Bubble (Power-Up)
    if (player.hasShield && player.lifeState === 'active') {
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -18 + idleOscillation, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 1. REUSABLE WHEEL SYSTEM (Rotates when vehicle moves)
    const wheelY = 0;
    const wheelPositions = [-18, 0, 18];
    wheelPositions.forEach(wx => {
      VehicleRenderer.renderWheel(ctx, wx, wheelY, player.wheelRotation);
    });

    // 2. FARM IMPROVISED CHASSIS (Wood planks, recycled metal plates, barrels)
    ctx.save();
    ctx.translate(0, idleOscillation);

    // Base chassis wood frame
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.roundRect(-26, -14, 52, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wood grain nails / bolts
    ctx.fillStyle = '#CBD5E1';
    [-20, -10, 10, 20].forEach(nx => {
      ctx.beginPath();
      ctx.arc(nx, -8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Character Custom Armor Plate / Farm element
    ctx.fillStyle = char.tankColor;
    ctx.beginPath();
    ctx.roundRect(-22, -22, 44, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bamboo / Scrap metal side banner
    ctx.fillStyle = char.themeColor;
    ctx.fillRect(-12, -20, 24, 8);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(-12, -20, 24, 8);

    // Insignia badge (banana, shell, carrot, bamboo, etc.)
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char.badgeSymbol, 0, -16);

    // 3. CANNON BARREL WITH RECOIL & ANGLE ROTATION
    const cannonBaseY = -18;
    const barrelLength = 34;
    const recoil = player.recoilOffset;
    const angleRad = (player.angle * Math.PI) / 180;

    ctx.save();
    ctx.translate(facing * 4, cannonBaseY);

    // Cannon pivot rotation
    ctx.rotate(-angleRad * facing);

    // Barrel body
    ctx.lineWidth = 7;
    ctx.strokeStyle = char.barrelColor;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-recoil * facing, 0);
    ctx.lineTo((barrelLength - recoil) * facing, 0);
    ctx.stroke();

    // Muzzle reinforcement ring
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc((barrelLength - recoil) * facing, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end cannon transform

    // 4. TURRET CUPOLA & CHARACTER HEAD/HELMET PLACEHOLDER
    ctx.fillStyle = char.themeColor;
    ctx.beginPath();
    ctx.arc(0, -26, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Character mascot insignia
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char.badgeSymbol, 0, -26);

    // 5. NAME & LIFE BAR OVERHEAD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-28, -52, 56, 16, 4);
    ctx.fill();
    ctx.strokeStyle = isActiveTurn ? '#FACC15' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.name, 0, -44);

    // Mini HP Bar under name
    const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-22, -38, 44, 3);
    ctx.fillStyle = hpPercent > 0.4 ? '#22C55E' : '#EF4444';
    ctx.fillRect(-22, -38, 44 * hpPercent, 3);

    ctx.restore(); // end idle oscillation
    ctx.restore(); // end root transform
  }

  /**
   * Reusable Wheel Concept: Heavy corrugated rubber wheel with spinning spokes
   */
  private static renderWheel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number
  ) {
    const radius = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Outer tire tread
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wheel rim hub
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Rotating spokes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, 0);
    ctx.lineTo(radius * 0.5, 0);
    ctx.moveTo(0, -radius * 0.5);
    ctx.lineTo(0, radius * 0.5);
    ctx.stroke();

    ctx.restore();
  }
}
