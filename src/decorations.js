const TREE1_FRAME_SIZE = 256;
const TREE1_DISPLAY    = 120;

const TREE3_FRAME_SIZE = 192;
const TREE3_DISPLAY    = 96;

const SHEEP_IDLE_FRAMES    = 6;
const SHEEP_MOVE_FRAMES    = 4;
const SHEEP_FRAME_SIZE     = 128;
const SHEEP_DISPLAY        = 78;
const SHEEP_FRAME_DURATION = 0.12;
const SHEEP_SPEED          = 0.3;
const MAX_DRIFT            = 0.35;

const TREE_DEFS = [
  { col: 2, row: 1, type: 'tree1' },  // vecinos: NW/N/NE en fila 0 — seguros
  { col: 3, row: 1, type: 'tree1' },  // vecinos: N/NE en fila 0 — seguros
  { col: 1, row: 2, type: 'tree3' },
  { col: 2, row: 3, type: 'tree1' },  // vecinos: solo tiles C — 100% seguro
  { col: 3, row: 3, type: 'tree3' },  // 96px, solo 16px sobre el tile SE border
];

const SHEEP_DEFS = [
  { col: 3, row: 2 },
  { col: 1, row: 3 },
];

export function createDecorations() {
  const trees = TREE_DEFS.map(({ col, row, type }) => ({ col, row, type }));

  const sheep = SHEEP_DEFS.map(({ col, row }) => ({
    homeCol: col,
    homeRow: row,
    driftX: 0,
    driftY: 0,
    vx: 0,
    vy: 0,
    frame: 0,
    frameTimer: 0,
    dirTimer: Math.random() * 2,
    moving: false,
    facingLeft: false,
  }));

  return { trees, sheep };
}

export function updateDecorations({ sheep }, dt) {
  for (const s of sheep) {
    s.dirTimer -= dt;
    if (s.dirTimer <= 0) {
      s.dirTimer = 1.5 + Math.random() * 2.5;
      s.moving   = Math.random() > 0.3;
      if (s.moving) {
        const angle = Math.random() * Math.PI * 2;
        s.vx = Math.cos(angle) * SHEEP_SPEED;
        s.vy = Math.sin(angle) * SHEEP_SPEED;
        s.facingLeft = s.vx < 0;
      }
    }

    if (s.moving) {
      s.driftX += s.vx * dt;
      s.driftY += s.vy * dt;
      const dist = Math.sqrt(s.driftX * s.driftX + s.driftY * s.driftY);
      if (dist > MAX_DRIFT) {
        s.driftX *= MAX_DRIFT / dist;
        s.driftY *= MAX_DRIFT / dist;
        s.vx = -s.vx;
        s.vy = -s.vy;
      }
    }

    const frames = s.moving ? SHEEP_MOVE_FRAMES : SHEEP_IDLE_FRAMES;
    s.frameTimer += dt;
    if (s.frameTimer >= SHEEP_FRAME_DURATION) {
      s.frameTimer -= SHEEP_FRAME_DURATION;
      s.frame = (s.frame + 1) % frames;
    }
  }
}

function drawTree(ctx, tree, imgs, tileSize, offsetX, offsetY) {
  const isLarge    = tree.type === 'tree1';
  const img        = isLarge ? imgs.tree1 : imgs.tree3;
  const frameSize  = isLarge ? TREE1_FRAME_SIZE : TREE3_FRAME_SIZE;
  const displaySize = isLarge ? TREE1_DISPLAY : TREE3_DISPLAY;

  const px = Math.round(offsetX + tree.col * tileSize + tileSize / 2 - displaySize / 2);
  const py = Math.round(offsetY + (tree.row + 1) * tileSize - displaySize);

  ctx.drawImage(img, 0, 0, frameSize, frameSize, px, py, displaySize, displaySize);
}

function drawSheep(ctx, s, imgs, tileSize, offsetX, offsetY) {
  const img = s.moving ? imgs.sheepMove : imgs.sheepIdle;
  const sx  = s.frame * SHEEP_FRAME_SIZE;
  const px  = Math.round(offsetX + (s.homeCol + 0.5 + s.driftX) * tileSize - SHEEP_DISPLAY / 2);
  const py  = Math.round(offsetY + (s.homeRow + 0.5 + s.driftY) * tileSize - SHEEP_DISPLAY / 2);

  ctx.save();
  if (s.facingLeft) {
    ctx.translate(px + SHEEP_DISPLAY, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, SHEEP_FRAME_SIZE, SHEEP_FRAME_SIZE, 0, 0, SHEEP_DISPLAY, SHEEP_DISPLAY);
  } else {
    ctx.drawImage(img, sx, 0, SHEEP_FRAME_SIZE, SHEEP_FRAME_SIZE, px, py, SHEEP_DISPLAY, SHEEP_DISPLAY);
  }
  ctx.restore();
}

export function decorationDrawCalls({ trees, sheep }, imgs, tileSize, offsetX, offsetY) {
  const calls = [];

  for (const tree of trees) {
    calls.push({
      tileY: tree.row + 0.5,
      draw:  (ctx) => drawTree(ctx, tree, imgs, tileSize, offsetX, offsetY),
    });
  }

  for (const s of sheep) {
    calls.push({
      tileY: s.homeRow + 0.5 + s.driftY,
      draw:  (ctx) => drawSheep(ctx, s, imgs, tileSize, offsetX, offsetY),
    });
  }

  return calls;
}
