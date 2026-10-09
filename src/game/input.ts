import { CameraController } from './camera';
import { PlayerManager } from './players';
import { TerrainManager } from './terrain';
import { getCharacterById } from '../config/characters';

export interface InputHandlerOptions {
  canvas: HTMLCanvasElement;
  camera: CameraController;
  players: PlayerManager;
  terrain: TerrainManager;
  getCurrentTurn: () => 'player1' | 'player2';
  onAngleChange?: (angle: number) => void;
  onFireRequest?: () => void;
  canInteract?: () => boolean;
}

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private camera: CameraController;
  private players: PlayerManager;
  private terrain: TerrainManager;
  private getCurrentTurn: () => 'player1' | 'player2';
  private onAngleChange?: (angle: number) => void;
  private onFireRequest?: () => void;
  private canInteract?: () => boolean;

  private isPointerDown = false;
  private isAiming = false;
  private isPanningCamera = false;
  private isMovingPlayer = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // The aim handle is intentionally long and remains fixed after release.
  private readonly aimHandleDistance = 150;
  private readonly aimHandleHitRadius = 34;

  constructor(options: InputHandlerOptions) {
    this.canvas = options.canvas;
    this.camera = options.camera;
    this.players = options.players;
    this.terrain = options.terrain;
    this.getCurrentTurn = options.getCurrentTurn;
    this.onAngleChange = options.onAngleChange;
    this.onFireRequest = options.onFireRequest;
    this.canInteract = options.canInteract;

    this.attachListeners();
  }

  private getPointerScreenPosition(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private worldToScreen(worldX: number, worldY: number) {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom,
      y: (worldY - this.camera.y) * this.camera.zoom
    };
  }

  private getAimHandleWorldPosition() {
    const activePlayer = this.players.getPlayer(this.getCurrentTurn());
    const angleRad = (activePlayer.angle * Math.PI) / 180;
    const facing = activePlayer.facing;
    const muzzleX = activePlayer.x + facing * 36;
    const muzzleY = activePlayer.y - 48;

    return {
      x: muzzleX + Math.cos(angleRad) * this.aimHandleDistance * facing,
      y: muzzleY - Math.sin(angleRad) * this.aimHandleDistance
    };
  }

  private isPointerOnPlayer(screenX: number, screenY: number): boolean {
    const activePlayer = this.players.getPlayer(this.getCurrentTurn());
    if (!activePlayer || activePlayer.lifeState !== 'active') return false;

    const screen = this.worldToScreen(activePlayer.x, activePlayer.y - activePlayer.height * 0.5);
    const halfW = Math.max(30, activePlayer.width * this.camera.zoom * 0.9);
    const halfH = Math.max(24, activePlayer.height * this.camera.zoom * 1.2);

    return (
      Math.abs(screenX - screen.x) <= halfW &&
      Math.abs(screenY - screen.y) <= halfH
    );
  }

  private isPointerOnAimHandle(screenX: number, screenY: number): boolean {
    const activePlayer = this.players.getPlayer(this.getCurrentTurn());
    if (!activePlayer || activePlayer.lifeState !== 'active') return false;

    const handle = this.getAimHandleWorldPosition();
    const screen = this.worldToScreen(handle.x, handle.y);
    return Math.hypot(screenX - screen.x, screenY - screen.y) <= this.aimHandleHitRadius;
  }

  private updateAimFromScreenCoords(screenX: number, screenY: number) {
    const currentTurn = this.getCurrentTurn();
    const activePlayer = this.players.getPlayer(currentTurn);
    if (!activePlayer || activePlayer.lifeState !== 'active') return;

    const worldX = screenX / this.camera.zoom + this.camera.x;
    const worldY = screenY / this.camera.zoom + this.camera.y;

    const char = getCharacterById(activePlayer.characterId);
    const facing = activePlayer.facing;
    const muzzleX = activePlayer.x + facing * 36;
    const muzzleY = activePlayer.y - 48;

    const dx = (worldX - muzzleX) * facing;
    const dy = muzzleY - worldY;

    // The circle controls only aiming. It never fires and never resets.
    if (dx <= 0) return;

    const calculatedAngle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
    const clampedAngle = Math.max(char.minAngle, Math.min(char.maxAngle, calculatedAngle));

    this.players.setAimAngle(currentTurn, clampedAngle);
    this.onAngleChange?.(clampedAngle);
  }

  private attachListeners() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handleCanvasPointerMove);
    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (this.canInteract && !this.canInteract()) return;
    const { x, y } = this.getPointerScreenPosition(e);
    const currentTurn = this.getCurrentTurn();
    const activePlayer = this.players.getPlayer(currentTurn);

    if (!activePlayer || activePlayer.lifeState !== 'active') return;

    this.isPointerDown = true;
    this.pointerStartX = x;
    this.pointerStartY = y;
    this.lastPointerX = x;
    this.lastPointerY = y;

    // IMPORTANT: only the visible aim circle starts an aim drag.
    // Clicking elsewhere keeps the aim exactly where it was.
    this.isAiming = this.isPointerOnAimHandle(x, y);
    // Dragging anywhere on the battlefield must NOT move the tank.
    // Movement starts only when the pointer begins directly on the active tank.
    this.isMovingPlayer = !this.isAiming && this.isPointerOnPlayer(x, y);
    this.isPanningCamera = false;

    if (this.isAiming) {
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture is optional; window listeners still handle the drag.
      }
      this.updateAimFromScreenCoords(x, y);
    }
  };

  private handleCanvasPointerMove = (e: PointerEvent) => {
    if (this.isPointerDown) return;
    // No hover aiming. The last selected angle remains stable until the circle is dragged.
  };

  private handleWindowPointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (this.isAiming) {
      // The aim circle follows the pointer while pressed.
      this.updateAimFromScreenCoords(screenX, screenY);
    } else if (this.isMovingPlayer) {
      const deltaX = screenX - this.lastPointerX;
      if (Math.abs(deltaX) > 1) {
        this.players.movePlayer(this.getCurrentTurn(), deltaX, this.terrain);
      }
    }

    this.lastPointerX = screenX;
    this.lastPointerY = screenY;
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.isAiming) {
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already have been released.
      }
    }

    // Release freezes the current angle/aim position. Nothing is reset.
    this.isPointerDown = false;
    this.isAiming = false;
    this.isMovingPlayer = false;
    this.isPanningCamera = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.canInteract && !this.canInteract()) return;
    const currentTurn = this.getCurrentTurn();

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.players.movePlayer(currentTurn, -14, this.terrain);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.players.movePlayer(currentTurn, 14, this.terrain);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      const p = this.players.getPlayer(currentTurn);
      const char = getCharacterById(p.characterId);
      const next = Math.min(char.maxAngle, p.angle + 1);
      this.players.setAimAngle(currentTurn, next);
      this.onAngleChange?.(next);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      const p = this.players.getPlayer(currentTurn);
      const char = getCharacterById(p.characterId);
      const next = Math.max(char.minAngle, p.angle - 1);
      this.players.setAimAngle(currentTurn, next);
      this.onAngleChange?.(next);
    } else if (e.key === ' ' || e.key === 'Enter') {
      this.onFireRequest?.();
    }
  };

  public destroy() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handleCanvasPointerMove);
    window.removeEventListener('pointermove', this.handleWindowPointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
