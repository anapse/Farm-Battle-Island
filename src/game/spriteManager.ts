/**
 * Farm Battle Island - Official Sprite Management & Slicing Engine
 * 
 * Manages loading and technical precision slicing of all 11 official sprite sheets
 * located in /assets/sprites/ while preserving exact design, colors, proportions,
 * and alpha transparency.
 */

import { getAssetUrl } from '../utils/assets';

export interface SpriteAtlasState {
  loaded: boolean;
  loading: boolean;
  error?: string;
  availableSprites: Record<string, boolean>;
}

export type CharacterSpriteId = 'mono' | 'tortuga' | 'gallina' | 'panda' | 'conejo' | 'mapache';
export type GroundTileId = 'grass_top' | 'rock' | 'water_shore' | 'pure_grass';
export type DecorationId = 'palm' | 'rocks' | 'crate' | 'hut' | 'bush' | 'crate_stack';
export type CombatIconId = 'single_missile' | 'double_missile' | 'triple_missile' | 'explosive_missile' | 'grenade' | 'heart';
export type ChestId = 'parachute' | 'open';

class SpriteManager {
  private static instance: SpriteManager;

  // Cached sliced canvas elements
  private characterSprites = new Map<CharacterSpriteId, HTMLCanvasElement>();
  private groundTiles = new Map<GroundTileId, HTMLCanvasElement>();
  private decorations = new Map<DecorationId, HTMLCanvasElement>();
  private combatIcons = new Map<CombatIconId, HTMLCanvasElement>();
  private chests = new Map<ChestId, HTMLCanvasElement>();
  private storkFrames: HTMLCanvasElement[] = [];

  // Full image elements
  private backgrounds = new Map<number, HTMLImageElement>();
  private menuBackground: HTMLImageElement | null = null;
  private logoImage: HTMLImageElement | null = null;

  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  public static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }

  /**
   * Helper to load an image from URL
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const resolvedSrc = getAssetUrl(src);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load sprite image: ${resolvedSrc}`));
      img.src = resolvedSrc;
    });
  }

  /**
   * Technical Slicer:
   * Extracts a sub-rectangle from a source image, creates an offscreen canvas,
   * and optionally makes solid white outer background pixels transparent
   * while keeping all artwork, anti-aliasing and interior colors pristine.
   */
  private sliceGridTile(
    sourceImg: HTMLImageElement,
    col: number,
    row: number,
    cols: number,
    rows: number,
    makeWhiteTransparent = true
  ): HTMLCanvasElement {
    const tileWidth = Math.floor(sourceImg.width / cols);
    const tileHeight = Math.floor(sourceImg.height / rows);
    const sx = col * tileWidth;
    const sy = row * tileHeight;

    const canvas = document.createElement('canvas');
    canvas.width = tileWidth;
    canvas.height = tileHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.drawImage(sourceImg, sx, sy, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);

    if (makeWhiteTransparent) {
      this.applyTransparencyPass(ctx, tileWidth, tileHeight);
    }

    return canvas;
  }

  /**
   * Flood fill / Chroma key to remove outer white background
   * while strictly protecting all character artwork, shadows, and interior whites (like eyes and feathers)
   */
  private applyTransparencyPass(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Fast check: If corners are already transparent, don't do anything
    const cornerAlpha = data[3];
    if (cornerAlpha === 0) return;

    // Check if background is predominantly white (r > 240, g > 240, b > 240)
    const isCornerWhite = (idx: number) => {
      return data[idx] > 235 && data[idx + 1] > 235 && data[idx + 2] > 235;
    };

    if (!isCornerWhite(0)) return;

    // Use flood fill BFS from the 4 corners so interior whites (eyes, teeth, feathers) are NEVER removed!
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    const pushIfWhite = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const idx = y * width + x;
      if (visited[idx]) return;
      const pIdx = idx * 4;
      // White threshold
      if (data[pIdx] > 238 && data[pIdx + 1] > 238 && data[pIdx + 2] > 238) {
        visited[idx] = 1;
        queue.push(idx);
      }
    };

    // Initialize from borders
    for (let x = 0; x < width; x++) {
      pushIfWhite(x, 0);
      pushIfWhite(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      pushIfWhite(0, y);
      pushIfWhite(width - 1, y);
    }

    // BFS
    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);

      // Make transparent
      data[curr * 4 + 3] = 0;

      pushIfWhite(cx + 1, cy);
      pushIfWhite(cx - 1, cy);
      pushIfWhite(cx, cy + 1);
      pushIfWhite(cx, cy - 1);
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Initializes and loads all official sprites from /assets/sprites/
   */
  public async loadAll(): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading && this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        // 1. Load Backgrounds
        const [bg1, bg2, bg3, menuBg, logo] = await Promise.allSettled([
          this.loadImage('/assets/sprites/fondo juego 1.png'),
          this.loadImage('/assets/sprites/fondo juego 2.png'),
          this.loadImage('/assets/sprites/fondo juego 3.png'),
          this.loadImage('/assets/sprites/fondomenu.png'),
          this.loadImage('/assets/sprites/logo.png')
        ]);

        if (bg1.status === 'fulfilled') this.backgrounds.set(1, bg1.value);
        if (bg2.status === 'fulfilled') this.backgrounds.set(2, bg2.value);
        if (bg3.status === 'fulfilled') this.backgrounds.set(3, bg3.value);
        if (menuBg.status === 'fulfilled') this.menuBackground = menuBg.value;
        if (logo.status === 'fulfilled') this.logoImage = logo.value;

        // 2. Load and slice Characters (personajes.png - 2 rows x 3 cols)
        try {
          const charSheet = await this.loadImage('/assets/sprites/personajes.png');
          this.characterSprites.set('mono', this.sliceGridTile(charSheet, 0, 0, 3, 2, false));
          this.characterSprites.set('tortuga', this.sliceGridTile(charSheet, 1, 0, 3, 2, false));
          this.characterSprites.set('gallina', this.sliceGridTile(charSheet, 2, 0, 3, 2, false));
          this.characterSprites.set('panda', this.sliceGridTile(charSheet, 0, 1, 3, 2, false));
          this.characterSprites.set('conejo', this.sliceGridTile(charSheet, 1, 1, 3, 2, false));
          this.characterSprites.set('mapache', this.sliceGridTile(charSheet, 2, 1, 3, 2, false));
        } catch (e) {
          console.warn('Official personajes.png not available yet', e);
        }

        // 3. Load and slice Ground Tiles (suelo.png - 2 rows x 2 cols)
        try {
          const groundSheet = await this.loadImage('/assets/sprites/suelo.png');
          this.groundTiles.set('grass_top', this.sliceGridTile(groundSheet, 0, 0, 2, 2, false));
          this.groundTiles.set('rock', this.sliceGridTile(groundSheet, 1, 0, 2, 2, false));
          this.groundTiles.set('water_shore', this.sliceGridTile(groundSheet, 0, 1, 2, 2, false));
          this.groundTiles.set('pure_grass', this.sliceGridTile(groundSheet, 1, 1, 2, 2, false));
        } catch (e) {
          console.warn('Official suelo.png not available yet', e);
        }

        // 4. Load and slice Decorations (decoracion.png - 2 rows x 3 cols)
        try {
          const decoSheet = await this.loadImage('/assets/sprites/decoracion.png');
          this.decorations.set('palm', this.sliceGridTile(decoSheet, 0, 0, 3, 2, true));
          this.decorations.set('rocks', this.sliceGridTile(decoSheet, 1, 0, 3, 2, true));
          this.decorations.set('crate', this.sliceGridTile(decoSheet, 2, 0, 3, 2, true));
          this.decorations.set('hut', this.sliceGridTile(decoSheet, 0, 1, 3, 2, true));
          this.decorations.set('bush', this.sliceGridTile(decoSheet, 1, 1, 3, 2, true));
          this.decorations.set('crate_stack', this.sliceGridTile(decoSheet, 2, 1, 3, 2, true));
        } catch (e) {
          console.warn('Official decoracion.png not available yet', e);
        }

        // 5. Load and slice Combat & Powerup Icons (balas.png - 2 rows x 3 cols)
        // 0,0 = bala normal | 1,0 = bala doble | 2,0 = bala triple
        // 0,1 = bala explosiva | 1,1 = granada | 2,1 = corazón
        try {
          let iconSheet: HTMLImageElement;
          try {
            iconSheet = await this.loadImage('/assets/sprites/balas.png');
          } catch {
            iconSheet = await this.loadImage('/assets/sprites/Iconos de combate y potenciadores retro.png');
          }
          this.combatIcons.set('single_missile', this.sliceGridTile(iconSheet, 0, 0, 3, 2, false));
          this.combatIcons.set('double_missile', this.sliceGridTile(iconSheet, 1, 0, 3, 2, false));
          this.combatIcons.set('triple_missile', this.sliceGridTile(iconSheet, 2, 0, 3, 2, false));
          this.combatIcons.set('explosive_missile', this.sliceGridTile(iconSheet, 0, 1, 3, 2, false));
          this.combatIcons.set('grenade', this.sliceGridTile(iconSheet, 1, 1, 3, 2, false));
          this.combatIcons.set('heart', this.sliceGridTile(iconSheet, 2, 1, 3, 2, false));
        } catch (e) {
          console.warn('Official combat icons (balas.png) not available yet', e);
        }

        // 6. Load and slice Chests (cofre.png - 1 row x 2 cols)
        try {
          const chestSheet = await this.loadImage('/assets/sprites/cofre.png');
          this.chests.set('parachute', this.sliceGridTile(chestSheet, 0, 0, 2, 1, true));
          this.chests.set('open', this.sliceGridTile(chestSheet, 1, 0, 2, 1, true));
        } catch (e) {
          console.warn('Official cofre.png not available yet', e);
        }

        // 7. Load and slice Stork flight animation (sigueña.png - 1 row x 4 cols)
        try {
          const storkSheet = await this.loadImage('/assets/sprites/sigueña.png');
          this.storkFrames = [
            this.sliceGridTile(storkSheet, 0, 0, 4, 1, true),
            this.sliceGridTile(storkSheet, 1, 0, 4, 1, true),
            this.sliceGridTile(storkSheet, 2, 0, 4, 1, true),
            this.sliceGridTile(storkSheet, 3, 0, 4, 1, true),
          ];
        } catch (e) {
          console.warn('Official sigueña.png not available yet', e);
        }

        this.isLoaded = true;
      } finally {
        this.isLoading = false;
      }
    })();

    return this.loadPromise;
  }

  // Getters
  public getCharacter(id: CharacterSpriteId): HTMLCanvasElement | null {
    return this.characterSprites.get(id) || null;
  }

  public getGroundTile(id: GroundTileId): HTMLCanvasElement | null {
    return this.groundTiles.get(id) || null;
  }

  public getDecoration(id: DecorationId): HTMLCanvasElement | null {
    return this.decorations.get(id) || null;
  }

  public getCombatIcon(id: CombatIconId): HTMLCanvasElement | null {
    return this.combatIcons.get(id) || null;
  }

  public getChest(id: ChestId): HTMLCanvasElement | null {
    return this.chests.get(id) || null;
  }

  public getStorkFrame(index: number): HTMLCanvasElement | null {
    if (this.storkFrames.length === 0) return null;
    const safeIdx = Math.abs(index) % this.storkFrames.length;
    return this.storkFrames[safeIdx];
  }

  public getBackground(theme: 1 | 2 | 3): HTMLImageElement | null {
    return this.backgrounds.get(theme) || null;
  }

  public getMenuBackground(): HTMLImageElement | null {
    return this.menuBackground;
  }

  public getLogo(): HTMLImageElement | null {
    return this.logoImage;
  }

  public hasSprites(): boolean {
    return this.isLoaded && (this.characterSprites.size > 0 || this.backgrounds.size > 0);
  }
}

export const spriteManager = SpriteManager.getInstance();
