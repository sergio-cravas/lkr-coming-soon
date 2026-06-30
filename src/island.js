// Tile type enum — numbers match the guide's tile numbers for clarity
export const T = {
  EMPTY: 0,
  NW: 1,   // top-left outer corner
  N:  2,   // top edge
  NE: 3,   // top-right outer corner
  W:  4,   // left edge
  C:  5,   // interior grass
  E:  6,   // right edge
  SW: 10,  // bottom-left outer corner
  S:  11,  // bottom edge
  SE: 12,  // bottom-right outer corner
};

// Irregular island — 5 rows × 6 cols.
// Top is staggered (irregular), bottom retains the lower notch.
// SW/S/SE use tileset row 2 (tiles 7-9) which have no top border,
// so the last grass row connects seamlessly to the interior above.
export const ISLAND_MAP = [
  [T.EMPTY, T.EMPTY, T.NW,   T.N,    T.NE,    T.EMPTY ],  // row 0
  [T.EMPTY, T.NW,    T.C,    T.C,    T.C,     T.NE    ],  // row 1
  [T.NW,    T.C,     T.C,    T.C,    T.C,     T.SE    ],  // row 2
  [T.SW,    T.C,     T.C,    T.C,    T.SE,    T.EMPTY ],  // row 3
  [T.EMPTY, T.SW,    T.S,    T.SE,   T.EMPTY, T.EMPTY ],  // row 4
];

export const COLS = 6;
export const ROWS = 5;

// Source rect for each grass tile in the tileset (64×64 per tile, 9 cols × 6 rows)
// The elevated-ground block sits in columns 5-7 of the sheet (cols 0-3 = flat ground)
const TILE_SRC = {
  [T.NW]: { c: 5, r: 0 },
  [T.N]:  { c: 6, r: 0 },
  [T.NE]: { c: 7, r: 0 },
  [T.W]:  { c: 5, r: 1 },
  [T.C]:  { c: 6, r: 1 },
  [T.E]:  { c: 7, r: 1 },
  [T.SW]: { c: 5, r: 2 },
  [T.S]:  { c: 6, r: 2 },
  [T.SE]: { c: 7, r: 2 },
};

// Single cliff tile per south edge (top row only — no second level)
const CLIFF_SRC = {
  left:   { c: 5, r: 4 },
  center: { c: 6, r: 4 },
  right:  { c: 7, r: 4 },
};

// Which cliff column variant to draw below each south-facing tile type
const CLIFF_FOR = {
  [T.SW]: 'left',
  [T.S]:  'center',
  [T.SE]: 'right',
};

const SRC_TILE = 64; // native tile size in the tileset PNG

export function renderIsland(ctx, tileset, tileSize, offsetX, offsetY) {
  for (let row = 0; row < ISLAND_MAP.length; row++) {
    for (let col = 0; col < ISLAND_MAP[row].length; col++) {
      const type = ISLAND_MAP[row][col];
      if (type === T.EMPTY) continue;

      const px = Math.round(offsetX + col * tileSize);
      const py = Math.round(offsetY + row * tileSize);

      const src = TILE_SRC[type];
      ctx.drawImage(
        tileset,
        src.c * SRC_TILE, src.r * SRC_TILE, SRC_TILE, SRC_TILE,
        px, py, tileSize, tileSize
      );

      // Single cliff tile drawn directly below each south-facing edge
      const cliffVariant = CLIFF_FOR[type];
      if (cliffVariant) {
        const src = CLIFF_SRC[cliffVariant];
        ctx.drawImage(
          tileset,
          src.c * SRC_TILE, src.r * SRC_TILE, SRC_TILE, SRC_TILE,
          px, py + tileSize, tileSize, tileSize
        );
      }
    }
  }
}

// Returns walkable status — all non-empty tiles are walkable in Phase 2
export function isWalkable(col, row) {
  if (row < 0 || row >= ISLAND_MAP.length) return false;
  if (col < 0 || col >= (ISLAND_MAP[row]?.length ?? 0)) return false;
  return ISLAND_MAP[row][col] !== T.EMPTY;
}

// Returns the pixel center of a tile (for positioning entities in Phase 3)
export function tileCenterPx(col, row, tileSize, offsetX, offsetY) {
  return {
    x: offsetX + col * tileSize + tileSize / 2,
    y: offsetY + row * tileSize + tileSize / 2,
  };
}
