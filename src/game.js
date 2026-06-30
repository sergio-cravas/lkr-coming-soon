// game.js — Phase 2: water background + clouds + floating island
// No bundler, no framework. Serve with a local static server.

import { renderIsland, COLS, ROWS } from './island.js';
import { createKnight, updateKnight, renderKnight } from './knight.js';
import { createDecorations, updateDecorations, decorationDrawCalls } from './decorations.js';

const canvas = document.getElementById('game');
let ctx;

const MAX_TILE_SIZE = 64; // CSS pixels per tile — shrinks on narrow screens

// ---------------------------------------------------------------------------
// Canvas setup with HiDPI support
// ---------------------------------------------------------------------------
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(window.innerWidth  * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

window.addEventListener('resize', setupCanvas);

// ---------------------------------------------------------------------------
// Keyboard input
// ---------------------------------------------------------------------------
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup',   e => { keys[e.code] = false; });

// ---------------------------------------------------------------------------
// Asset loading
// ---------------------------------------------------------------------------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// Water background — 64×64 source tile, drawn at 128×128 CSS px (2× upscale)
// ---------------------------------------------------------------------------
function drawWater(waterImg) {
  const tileSize = 128;
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (let y = 0; y < h; y += tileSize) {
    for (let x = 0; x < w; x += tileSize) {
      ctx.drawImage(waterImg, x, y, tileSize, tileSize);
    }
  }
}

// ---------------------------------------------------------------------------
// Cloud system
// ---------------------------------------------------------------------------
let clouds = [];

function initClouds(cloudImgs) {
  const scales = [0.45, 0.60, 0.38, 0.52, 0.42];
  const speeds = [22,   30,   18,   26,   24  ];
  clouds = cloudImgs.map((img, i) => ({
    img,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.7,
    speed: speeds[i],
    scale: scales[i],
  }));
}

function updateClouds(dt) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const c of clouds) {
    c.x -= c.speed * dt;
    if (c.x + c.img.width * c.scale < 0) {
      c.x = w + 50 + Math.random() * 250;
      c.y = Math.random() * h * 0.7;
    }
  }
}

function drawClouds() {
  for (const c of clouds) {
    ctx.drawImage(
      c.img, 0, 0, c.img.width, c.img.height,
      Math.round(c.x), Math.round(c.y),
      Math.round(c.img.width  * c.scale),
      Math.round(c.img.height * c.scale)
    );
  }
}

// ---------------------------------------------------------------------------
// Island — responsive tile size + centered on canvas
// ---------------------------------------------------------------------------
function getLayout() {
  const H_MARGIN = 48; // minimum water visible on each side (px)
  const tileSize = Math.min(MAX_TILE_SIZE, Math.floor((window.innerWidth - H_MARGIN * 2) / COLS));
  const islandW  = COLS * tileSize;
  const islandH  = ROWS * tileSize;
  return {
    tileSize,
    offsetX: Math.round((window.innerWidth  - islandW) / 2),
    offsetY: Math.round((window.innerHeight - islandH) / 2 - tileSize),
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
async function init() {
  setupCanvas();

  const [
    waterImg, tileset,
    warriorIdle, warriorRun,
    tree1Img, tree3Img, sheepIdleImg, sheepMoveImg,
    ...cloudImgs
  ] = await Promise.all([
    loadImage('assets/water_bg.png'),
    loadImage('assets/tileset.png'),
    loadImage('assets/warrior_idle.png'),
    loadImage('assets/warrior_run.png'),
    loadImage('assets/tree1.png'),
    loadImage('assets/tree3.png'),
    loadImage('assets/sheep_idle.png'),
    loadImage('assets/sheep_move.png'),
    loadImage('assets/cloud_01.png'),
    loadImage('assets/cloud_02.png'),
    loadImage('assets/cloud_03.png'),
    loadImage('assets/cloud_04.png'),
    loadImage('assets/cloud_05.png'),
  ]);

  const decImgs = { tree1: tree1Img, tree3: tree3Img, sheepIdle: sheepIdleImg, sheepMove: sheepMoveImg };

  initClouds(cloudImgs);
  const knight      = createKnight(2, 2);
  const decorations = createDecorations();

  let lastTs = null;

  function loop(ts) {
    const dt = lastTs !== null ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
    lastTs = ts;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawWater(waterImg);

    const { tileSize, offsetX, offsetY } = getLayout();
    renderIsland(ctx, tileset, tileSize, offsetX, offsetY);

    updateDecorations(decorations, dt);
    updateKnight(knight, dt, keys);

    // Y-sort: trees, sheep, and knight drawn back-to-front
    const drawCalls = decorationDrawCalls(decorations, decImgs, tileSize, offsetX, offsetY);
    drawCalls.push({
      tileY: knight.tileY,
      draw:  (ctx) => renderKnight(ctx, knight, warriorIdle, warriorRun, tileSize, offsetX, offsetY),
    });
    drawCalls.sort((a, b) => a.tileY - b.tileY);
    for (const call of drawCalls) call.draw(ctx);

    updateClouds(dt);
    drawClouds();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

init().catch(err => console.error('Game init failed:', err));
