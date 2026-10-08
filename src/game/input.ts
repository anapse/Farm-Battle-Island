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
}

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private camera: CameraController;
  private players: PlayerManager;
  private terrain: TerrainManager;
  private getCurrentTurn: () => 'player1' | 'player2';
  private onAngleChange?: (angle: number) => void;
  private onFireRequest?: () => void;

  private isPointerDown: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private hasDraggedCamera: boolean = false;

  constructor(options: InputHandlerOptions) {
    this.canvas = options.canvas;
    this.camera = options.camera;
    this.players = options.players;
    this.terrain = options.terrain;
    this.getCurrentTurn = options.getCurrentTurn;
    this.onAngleChange = options.onAngleChange;
    this.onFireRequest = options.onFireRequest;

    this.attachListeners();
  }

  private attachListeners() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handleCanvasPointerMove);
    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);

    window.addEventListener('keydown', this.handleKeyDown);
  }

  private updateAimFromScreenCoords(screenX: number, screenY: number) {
    const currentTurn = this.getCurrentTurn();
    const activePlayer = this.players.getPlayer(currentTurn);
    if (!activePlayer || activePlayer.lifeState !== 'active') return;

    // Convert screen coordinates to world coordinates
    const worldX = screenX / this.camera.zoom + this.camera.x;
    const worldY = screenY / this.camera.zoom + this.camera.y;

    const char = getCharacterById(activePlayer.characterId);
    const facing = activePlayer.facing; // 1 = right, -1 = left

    const muzzleX = activePlayer.x + facing * 36;
    const muzzleY = activePlayer.y - 48;

    const dx = (worldX - muzzleX) * facing;
    const dy = muzzleY - worldY; // positive Y is upward

    if (dx > -50) {
      const calculatedAngle = Math.round(Math.atan2(dy, Math.max(1, dx)) * (180 / Math.PI));
      const clampedAngle = Math.max(char.minAngle, Math.min(char.maxAngle, calculatedAngle));
      this.players.setAimAngle(currentTurn, clampedAngle);
      if (this.onAngleChange) {
        this.onAngleChange(clampedAngle);
      }
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    this.isPointerDown = true;
    this.hasDraggedCamera = false;
    this.pointerStartX = screenX;
    this.pointerStartY = screenY;
    this.lastPointerX = screenX;
    this.lastPointerY = screenY;

    // Also update aim angle on click
    this.updateAimFromScreenCoords(screenX, screenY);
  };

  private handleCanvasPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // If not dragging, hovering mouse controls the cannon aim angle
    if (!this.isPointerDown) {
      this.updateAimFromScreenCoords(screenX, screenY);
    }
  };

  private handleWindowPointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const deltaX = screenX - this.lastPointerX;
    const totalDist = Math.hypot(screenX - this.pointerStartX, screenY - this.pointerStartY);

    if (totalDist > 8) {
      this.hasDraggedCamera = true;
      // Horizontal camera panning across the world
      this.camera.manualPan(deltaX, 0);
    }

    // While dragging, also track aim
    this.updateAimFromScreenCoords(screenX, screenY);

    this.lastPointerX = screenX;
    this.lastPointerY = screenY;
  };

  private handlePointerUp = () => {
    this.isPointerDown = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
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
      if (this.onAngleChange) this.onAngleChange(next);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      const p = this.players.getPlayer(currentTurn);
      const char = getCharacterById(p.characterId);
      const next = Math.max(char.minAngle, p.angle - 1);
      this.players.setAimAngle(currentTurn, next);
      if (this.onAngleChange) this.onAngleChange(next);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (this.onFireRequest) this.onFireRequest();
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
