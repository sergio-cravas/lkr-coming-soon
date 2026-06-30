import { isWalkable } from './island.js';

const FRAME_SIZE    = 192;
const DISPLAY_SIZE  = 115;  // 64 * 1.8
const FRAME_DURATION = 0.1;  // seconds per frame
const SPEED         = 2.5;   // tiles per second
const IDLE_FRAMES   = 8;
const RUN_FRAMES    = 6;

export function createKnight(startCol, startRow) {
  return {
    tileX:      startCol + 0.5,
    tileY:      startRow + 0.5,
    frame:      0,
    frameTimer: 0,
    facingLeft: false,
    moving:     false,
  };
}

export function updateKnight(knight, dt, keys) {
  let dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['KeyA']) dx -= 1;
  if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
  if (keys['ArrowUp']    || keys['KeyW']) dy -= 1;
  if (keys['ArrowDown']  || keys['KeyS']) dy += 1;

  knight.moving = dx !== 0 || dy !== 0;

  if (knight.moving) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;

    if (dx !== 0) knight.facingLeft = dx < 0;

    const newX = knight.tileX + dx * SPEED * dt;
    const newY = knight.tileY + dy * SPEED * dt;

    if (isWalkable(Math.floor(newX), Math.floor(knight.tileY))) knight.tileX = newX;
    if (isWalkable(Math.floor(knight.tileX), Math.floor(newY))) knight.tileY = newY;
  }

  const totalFrames = knight.moving ? RUN_FRAMES : IDLE_FRAMES;
  knight.frameTimer += dt;
  if (knight.frameTimer >= FRAME_DURATION) {
    knight.frameTimer -= FRAME_DURATION;
    knight.frame = (knight.frame + 1) % totalFrames;
  }
}

export function renderKnight(ctx, knight, idleImg, runImg, tileSize, offsetX, offsetY) {
  const img = knight.moving ? runImg : idleImg;
  const sx  = knight.frame * FRAME_SIZE;
  const px  = Math.round(offsetX + knight.tileX * tileSize - DISPLAY_SIZE / 2);
  const py  = Math.round(offsetY + knight.tileY * tileSize - DISPLAY_SIZE / 2);

  ctx.save();
  if (knight.facingLeft) {
    ctx.translate(px + DISPLAY_SIZE, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, FRAME_SIZE, FRAME_SIZE, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
  } else {
    ctx.drawImage(img, sx, 0, FRAME_SIZE, FRAME_SIZE, px, py, DISPLAY_SIZE, DISPLAY_SIZE);
  }
  ctx.restore();
}
