export class WorldConfig {
  // Virtual World Dimensions (approx 2.5 mobile screens wide)
  public static readonly WORLD_WIDTH = 2400; // 50 columns x 48px; includes the full right island and sprite overhang
  public static readonly WORLD_HEIGHT = 1280;

  // Water & Depth levels
  public static readonly WATER_Y = 1040;
  public static readonly SAFETY_FLOOR_Y = 1140; // Safety floor under water
  public static readonly DEATH_FLOOR_Y = 1240; // Complete death line

  // Physical constants
  public static readonly GRAVITY = 720; // px / sec^2
  public static readonly BASE_PROJECTILE_SPEED = 1250; // px / sec

  // Block Geometry
  public static readonly BLOCK_WIDTH = 48;
  public static readonly BLOCK_HEIGHT = 48;
  public static readonly COLUMNS_PER_ISLAND = 20;

  // Island Column Spans in Virtual Coordinates
  public static readonly LEFT_ISLAND_START_COL = 0;
  public static readonly LEFT_ISLAND_END_COL = 20;

  public static readonly RIGHT_ISLAND_START_COL = 29;
  public static readonly RIGHT_ISLAND_END_COL = 49;

  public static readonly TOTAL_COLUMNS = 50;
}

export interface WindEngineState {
  direction: -1 | 1;
  speed: number; // km/h (e.g. 5 to 25)
  angleDeg: number;
}
