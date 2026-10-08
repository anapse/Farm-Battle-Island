import { WorldConfig } from './world';

export type CameraFollowMode = 'player1' | 'player2' | 'projectile' | 'center' | 'manual';

export class CameraController {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public zoom: number = 1.0;
  public followMode: CameraFollowMode = 'player1';

  public viewportWidth: number = 720;
  public viewportHeight: number = 1280;

  private shakeIntensity: number = 0;
  private shakeDecay: number = 18;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.resize(viewportWidth, viewportHeight);
  }

  public resize(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Adjust zoom dynamically so the vertical frame fits the world height comfortably
    const baseHeight = WorldConfig.WORLD_HEIGHT;
    this.zoom = Math.max(0.65, Math.min(1.2, height / baseHeight));
  }

  public setMode(mode: CameraFollowMode) {
    this.followMode = mode;
  }

  public setTarget(worldX: number, worldY: number) {
    const viewW = this.viewportWidth / this.zoom;
    const viewH = this.viewportHeight / this.zoom;

    const minX = 0;
    const maxX = Math.max(0, WorldConfig.WORLD_WIDTH - viewW);
    const minY = 0;
    const maxY = Math.max(0, WorldConfig.WORLD_HEIGHT - viewH);

    this.targetX = Math.max(minX, Math.min(maxX, worldX - viewW / 2));
    this.targetY = Math.max(minY, Math.min(maxY, worldY - viewH / 2));
  }

  public snapToTarget() {
    this.x = this.targetX;
    this.y = this.targetY;
  }

  public manualPan(deltaX: number, deltaY: number) {
    this.followMode = 'manual';
    const viewW = this.viewportWidth / this.zoom;
    const viewH = this.viewportHeight / this.zoom;

    const minX = 0;
    const maxX = Math.max(0, WorldConfig.WORLD_WIDTH - viewW);
    const minY = 0;
    const maxY = Math.max(0, WorldConfig.WORLD_HEIGHT - viewH);

    this.targetX = Math.max(minX, Math.min(maxX, this.targetX - deltaX / this.zoom));
    this.targetY = Math.max(minY, Math.min(maxY, this.targetY - deltaY / this.zoom));
  }

  public addShake(intensity: number) {
    this.shakeIntensity = Math.min(25, this.shakeIntensity + intensity);
  }

  public update(dt: number) {
    // Smooth camera lerp
    const lerpSpeed = 0.08;
    this.x += (this.targetX - this.x) * lerpSpeed;
    this.y += (this.targetY - this.y) * lerpSpeed;

    // Decay shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }
  }

  public applyTransform(ctx: CanvasRenderingContext2D) {
    let shakeX = 0;
    let shakeY = 0;

    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + shakeX, -this.y + shakeY);
  }
}
