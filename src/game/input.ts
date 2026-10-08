import { CameraController } from './camera';
import { PlayerManager } from './players';
import { TerrainManager } from './terrain';

export interface InputHandlerOptions {
  canvas: HTMLCanvasElement;
  camera: CameraController;
  players: PlayerManager;
  terrain: TerrainManager;
  getCurrentTurn: () => 'player1' | 'player2';
  onAngleDelta?: (delta: number) => void;
  onFireRequest?: () => void;
}

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private camera: CameraController;
  private players: PlayerManager;
  private terrain: TerrainManager;
  private getCurrentTurn: () => 'player1' | 'player2';
  private onAngleDelta?: (delta: number) => void;
  private onFireRequest?: () => void;

  private isPointerDown: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private isInteractingWithPlayer: boolean = false;

  constructor(options: InputHandlerOptions) {
    this.canvas = options.canvas;
    this.camera = options.camera;
    this.players = options.players;
    this.terrain = options.terrain;
    this.getCurrentTurn = options.getCurrentTurn;
    this.onAngleDelta = options.onAngleDelta;
    this.onFireRequest = options.onFireRequest;

    this.attachListeners();
  }

  private attachListeners() {
    // Mouse / Touch handlers
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);

    // Keyboard shortcuts for desktop testing
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handlePointerDown = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates
    const worldX = screenX / this.camera.zoom + this.camera.x;
    const worldY = screenY / this.camera.zoom + this.camera.y;

    const currentTurn = this.getCurrentTurn();
    const activePlayer = this.players.getPlayer(currentTurn);

    // Check if pointer is near the active player (touch/drag to move)
    const distToPlayer = Math.hypot(worldX - activePlayer.x, worldY - (activePlayer.y - 18));
    if (distToPlayer < 75) {
      this.isInteractingWithPlayer = true;
    } else {
      this.isInteractingWithPlayer = false;
    }

    this.isPointerDown = true;
    this.pointerStartX = screenX;
    this.pointerStartY = screenY;
    this.lastPointerX = screenX;
    this.lastPointerY = screenY;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const dx = screenX - this.lastPointerX;
    const dy = screenY - this.lastPointerY;

    if (this.isInteractingWithPlayer) {
      // Dragging player vehicle left/right across terrain
      const currentTurn = this.getCurrentTurn();
      this.players.movePlayer(currentTurn, dx * 1.5, this.terrain);
    } else {
      // Dragging camera to freely explore the map
      this.camera.manualPan(dx, dy);
    }

    this.lastPointerX = screenX;
    this.lastPointerY = screenY;
  };

  private handlePointerUp = () => {
    this.isPointerDown = false;
    this.isInteractingWithPlayer = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Only process if in battle and canvas is active
    const currentTurn = this.getCurrentTurn();

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.players.movePlayer(currentTurn, -14, this.terrain);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.players.movePlayer(currentTurn, 14, this.terrain);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (this.onAngleDelta) this.onAngleDelta(1);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      if (this.onAngleDelta) this.onAngleDelta(-1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (this.onFireRequest) this.onFireRequest();
    }
  };

  public destroy() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
