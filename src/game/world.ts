export class WorldConfig {
  // Virtual World Dimensions (approx 2.5 mobile screens wide)
  public static readonly WORLD_WIDTH = 2400;
  public static readonly WORLD_HEIGHT = 1200;

  // Water & Depth levels
  public static readonly WATER_Y = 820;
  public static readonly SAFETY_FLOOR_Y = 980; // Safety floor under water
  public static readonly DEATH_FLOOR_Y = 1100; // Complete death line

  // Physical constants
  public static readonly GRAVITY = 720; // px / sec^2
  public static readonly BASE_PROJECTILE_SPEED = 640; // px / sec

  // Block Geometry
  public static readonly BLOCK_WIDTH = 44;
  public static readonly BLOCK_HEIGHT = 44;
  public static readonly COLUMNS_PER_ISLAND = 20;

  // Island Column Spans in Virtual Coordinates
  public static readonly LEFT_ISLAND_START_COL = 3;
  public static readonly LEFT_ISLAND_END_COL = 22;

  public static readonly RIGHT_ISLAND_START_COL = 34;
  public static readonly RIGHT_ISLAND_END_COL = 53;

  public static readonly TOTAL_COLUMNS = 58;
}

export interface WindEngineState {
  direction: -1 | 1;
  speed: number; // km/h (e.g. 5 to 25)
  angleDeg: number;
}
