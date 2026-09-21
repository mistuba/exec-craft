import {
  getEnemyScale,
  getEnemySprite,
  getTowerScale,
  getTowerSprite,
  SIGN_END,
  SIGN_SPAWN,
  TILE_GRASS_A,
  TILE_GRASS_B,
  TILE_ROAD,
  TILE_ROAD_EDGE,
} from '../art/sprites'
import { drawPixelSprite } from '../art/pixelArt'
import { ENEMY_DEFS } from '../config/enemies'
import {
  BUILD_GRID,
  CELL,
  COLS,
  MAP_H,
  MAP_W,
  PATH_WAYPOINTS,
  ROWS,
} from '../config/level1'
import { TOWER_DEFS } from '../config/towers'
import type { GameSnapshot } from './engine'

export function drawGame(
  ctx: CanvasRenderingContext2D,
  snap: GameSnapshot,
  hoverCell: { col: number; row: number } | null,
): void {
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, MAP_W, MAP_H)

  drawSkyBackdrop(ctx)
  drawTileMap(ctx)
  drawPathDecor(ctx)
  drawRangeOverlays(ctx, snap, hoverCell)
  drawBuildHover(ctx, snap, hoverCell)
  drawTowers(ctx, snap)
  drawCorpses(ctx, snap)
  drawEnemies(ctx, snap)
  drawProjectiles(ctx, snap)
  drawHitEffects(ctx, snap)
  drawFloats(ctx, snap)
  drawSpawnAndEnd(ctx)

  ctx.restore()
}

function drawSkyBackdrop(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, MAP_H)
  g.addColorStop(0, '#2a3d5c')
  g.addColorStop(0.35, '#1e3328')
  g.addColorStop(1, '#142218')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, MAP_W, MAP_H)
}

function drawTileMap(ctx: CanvasRenderingContext2D): void {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * CELL
      const y = row * CELL
      const isRoad = BUILD_GRID[row][col] === 1
      const sprite = isRoad
        ? hasRoadNeighbor(row, col)
          ? TILE_ROAD
          : TILE_ROAD_EDGE
        : (row + col) % 2 === 0
          ? TILE_GRASS_A
          : TILE_GRASS_B
      ctx.drawImage(sprite, x, y, CELL, CELL)
      if (!isRoad && (row * 7 + col * 11) % 23 === 0) {
        drawPixelSprite(ctx, TILE_GRASS_B, x + CELL / 2, y + CELL / 2, 0.55, 0.35)
      }
    }
  }
}

function hasRoadNeighbor(row: number, col: number): boolean {
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]
  for (const [dr, dc] of dirs) {
    const r = row + dr
    const c = col + dc
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && BUILD_GRID[r][c] === 0) return false
  }
  return true
}

function drawPathDecor(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 3
  ctx.lineCap = 'square'
  ctx.beginPath()
  ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y)
  for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
    ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y)
  }
  ctx.stroke()
}

function drawRangeOverlays(
  ctx: CanvasRenderingContext2D,
  snap: GameSnapshot,
  hover: { col: number; row: number } | null,
): void {
  if (hover && snap.buildKind && BUILD_GRID[hover.row]?.[hover.col] === 0) {
    const occupied = snap.towers.some((t) => t.col === hover.col && t.row === hover.row)
    if (!occupied) {
      const def = TOWER_DEFS[snap.buildKind]
      const stats = def.levels[0]
      const cx = hover.col * CELL + CELL / 2
      const cy = hover.row * CELL + CELL / 2
      drawRangeCircle(ctx, cx, cy, stats.range, 'rgba(88, 214, 141, 0.12)', 'rgba(88, 214, 141, 0.85)')
    }
  }

  const sel = snap.towers.find((t) => t.id === snap.selectedTowerId)
  if (sel) {
    const def = TOWER_DEFS[sel.kind]
    const stats = def.levels[sel.level - 1]
    drawRangeCircle(ctx, sel.x, sel.y, stats.range, 'rgba(241, 196, 15, 0.14)', 'rgba(241, 196, 15, 0.9)')
  }
}

function drawRangeCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke: string,
): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.setLineDash([5, 4])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawBuildHover(
  ctx: CanvasRenderingContext2D,
  snap: GameSnapshot,
  hover: { col: number; row: number } | null,
): void {
  if (!hover || BUILD_GRID[hover.row]?.[hover.col] !== 0) return
  const x = hover.col * CELL
  const y = hover.row * CELL
  const occupied = snap.towers.some((t) => t.col === hover.col && t.row === hover.row)
  if (snap.buildKind && !occupied) {
    ctx.fillStyle = 'rgba(88, 214, 141, 0.35)'
    ctx.fillRect(x, y, CELL, CELL)
    ctx.strokeStyle = '#58d68d'
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2)
  } else if (occupied) {
    ctx.fillStyle = 'rgba(241, 196, 15, 0.28)'
    ctx.fillRect(x, y, CELL, CELL)
  }
}

function drawTowers(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const t of snap.towers) {
    const sprite = getTowerSprite(t.kind)
    const scale = getTowerScale(t.level)
    if (t.id === snap.selectedTowerId) {
      ctx.fillStyle = 'rgba(241, 196, 15, 0.25)'
      ctx.fillRect(t.col * CELL, t.row * CELL, CELL, CELL)
    }
    drawPixelSprite(ctx, sprite, t.x, t.y - 2, scale)
    if (t.level === 2) {
      drawPixelStar(ctx, t.x + 10, t.y - 18)
    }
  }
}

function drawPixelStar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#f1c40f'
  ctx.fillRect(x - 2, y, 4, 4)
  ctx.fillRect(x, y - 2, 4, 4)
  ctx.fillStyle = '#fff3a3'
  ctx.fillRect(x, y, 2, 2)
}

function drawCorpses(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const c of snap.corpses) {
    const sprite = getEnemySprite(c.kind)
    const alpha = Math.max(0, c.life / c.maxLife)
    const scale = getEnemyScale(c.kind) * (0.5 + 0.35 * alpha)
    drawPixelSprite(ctx, sprite, c.x, c.y + 6, scale, alpha * 0.55)
    ctx.fillStyle = `rgba(0,0,0,${0.25 * alpha})`
    ctx.fillRect(c.x - 10, c.y + 8, 20, 4)
  }
}

function drawEnemies(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const e of snap.enemies) {
    const def = ENEMY_DEFS[e.kind]
    const slowed = e.slowUntil > snap.time
    const bob = Math.sin(snap.time * 8 + e.id) * 1.5
    const sprite = getEnemySprite(e.kind)
    const scale = getEnemyScale(e.kind)

    if (slowed) {
      ctx.fillStyle = 'rgba(133, 216, 255, 0.35)'
      ctx.fillRect(e.x - def.radius - 2, e.y - def.radius - 2, (def.radius + 2) * 2, (def.radius + 2) * 2)
    }

    drawPixelSprite(ctx, sprite, e.x, e.y + bob, scale)

    const w = def.radius * 2 + 4
    const hpRatio = Math.max(0, e.hp / e.maxHp)
    ctx.fillStyle = '#1a1423'
    ctx.fillRect(e.x - w / 2, e.y - def.radius - 12, w, 5)
    ctx.fillStyle = hpRatio > 0.35 ? '#58d68d' : '#e74c3c'
    ctx.fillRect(e.x - w / 2 + 1, e.y - def.radius - 11, (w - 2) * hpRatio, 3)
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const p of snap.projectiles) {
    const x = p.fromX + (p.toX - p.fromX) * p.progress
    const y = p.fromY + (p.toY - p.fromY) * p.progress
    const def = TOWER_DEFS[p.towerKind]
    const tail = Math.min(0.35, p.progress)
    const tx = p.fromX + (p.toX - p.fromX) * Math.max(0, p.progress - tail)
    const ty = p.fromY + (p.toY - p.fromY) * Math.max(0, p.progress - tail)

    ctx.strokeStyle = def.color
    ctx.lineWidth = p.towerKind === 'bolt' ? 2 : 3
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.fillStyle = def.color
    const s = p.towerKind === 'ember' ? 5 : 4
    ctx.fillRect(Math.round(x) - s / 2, Math.round(y) - s / 2, s, s)
    ctx.fillStyle = '#fff8'
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2)
  }
}

function drawHitEffects(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const h of snap.hitEffects) {
    const def = TOWER_DEFS[h.towerKind]
    const t = 1 - h.life / h.maxLife
    const r = h.radius * (0.4 + t * 0.9)
    ctx.globalAlpha = 1 - t
    ctx.strokeStyle = def.color
    ctx.lineWidth = 2
    const steps = 8
    for (let i = 0; i < steps; i++) {
      const a = (Math.PI * 2 * i) / steps
      const px = h.x + Math.cos(a) * r
      const py = h.y + Math.sin(a) * r
      ctx.fillStyle = def.color
      ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3)
    }
    ctx.globalAlpha = 1
  }
}

function drawFloats(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  ctx.font = 'bold 11px ui-monospace, "Courier New", monospace'
  ctx.textAlign = 'center'
  for (const f of snap.floats) {
    ctx.globalAlpha = Math.min(1, f.life)
    ctx.fillStyle = '#1a1423'
    ctx.fillText(f.text, f.x + 1, f.y - (1.2 - f.life) * 28 + 1)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, f.x, f.y - (1.2 - f.life) * 28)
    ctx.globalAlpha = 1
  }
}

function drawSpawnAndEnd(ctx: CanvasRenderingContext2D): void {
  const s = PATH_WAYPOINTS[0]
  const e = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1]
  drawPixelSprite(ctx, SIGN_SPAWN, s.x, s.y - 22, 2.2)
  drawPixelSprite(ctx, SIGN_END, e.x - 8, e.y - 8, 2.2)
  ctx.font = 'bold 10px ui-monospace, "Courier New", monospace'
  ctx.fillStyle = '#dff9ff'
  ctx.fillText('入口', s.x, s.y - 38)
  ctx.fillStyle = '#ffb3b3'
  ctx.fillText('营地', e.x - 8, e.y - 26)
}
