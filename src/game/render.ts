import { getDebrisSprite } from '../art/debrisSprites'
import { getGrassTile } from '../art/grassTile'
import { getRoadAutotile } from '../art/roadAutotile'
import {
  getEnemyScale,
  getEnemySprite,
  getTowerScale,
  getTowerSprite,
} from '../art/sprites'
import { getCampMarker, getHoleMarker } from '../art/sceneMarkers'
import { activeDecorations } from '../config/mapDecorations'
import { drawPixelSprite } from '../art/pixelArt'
import { ENEMY_DEFS } from '../config/enemies'
import {
  BUILD_GRID,
  CELL,
  COLS,
  MAP_H,
  MAP_W,
  ROWS,
} from '../config/level1'
import {
  goalAnchor,
  PATH_WAYPOINTS,
  pathTangentAtEnd,
  pathTangentAtStart,
} from './path'
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
  drawGrassDecor(ctx)
  drawRangeOverlays(ctx, snap, hoverCell)
  drawBuildHover(ctx, snap, hoverCell)
  drawTowers(ctx, snap)
  drawCorpses(ctx, snap)
  drawEnemies(ctx, snap)
  drawProjectiles(ctx, snap)
  drawHitEffects(ctx, snap)
  drawFloats(ctx, snap)
  drawSpawnAndEnd(ctx, snap)
  if (snap.paused) drawPausedBanner(ctx)

  ctx.restore()
}

function drawPausedBanner(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.fillRect(0, 0, MAP_W, MAP_H)
  ctx.font = 'bold 20px ui-monospace, "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#dff9ff'
  ctx.fillText('已暂停', MAP_W / 2, MAP_H / 2 - 8)
  ctx.font = '12px system-ui, "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#c8d6e5'
  ctx.fillText('点击「继续」恢复', MAP_W / 2, MAP_H / 2 + 16)
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
      const sprite =
        BUILD_GRID[row][col] === 1
          ? getRoadAutotile(row, col)
          : getGrassTile(row, col)
      ctx.drawImage(sprite, x, y, CELL, CELL)
    }
  }
}

function drawGrassDecor(ctx: CanvasRenderingContext2D): void {
  for (const d of activeDecorations()) {
    drawPixelSprite(ctx, getDebrisSprite(d.kind), d.x, d.y, d.scale)
  }
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
      drawRangeCircle(ctx, cx, cy, stats.range, 'rgba(88, 166, 255, 0.14)', 'rgba(136, 196, 255, 0.95)')
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
  const cx = x + CELL / 2
  const cy = y + CELL / 2
  const occupied = snap.towers.some((t) => t.col === hover.col && t.row === hover.row)
  if (snap.buildKind && !occupied) {
    drawTowerFoundation(ctx, cx, cy, true)
    ctx.fillStyle = 'rgba(136, 196, 255, 0.22)'
    ctx.fillRect(x, y, CELL, CELL)
    ctx.strokeStyle = '#e8f4ff'
    ctx.lineWidth = 3
    ctx.strokeRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3)
    ctx.strokeStyle = '#3d7ea6'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8)
    const ghost = getTowerSprite(snap.buildKind)
    drawPixelSprite(ctx, ghost, cx, cy - 2, getTowerScale(1), 0.72)
  } else if (occupied) {
    ctx.fillStyle = 'rgba(241, 196, 15, 0.28)'
    ctx.fillRect(x, y, CELL, CELL)
  }
}

function drawTowerFoundation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  preview = false,
): void {
  ctx.fillStyle = preview ? '#6b6358' : '#5a5248'
  ctx.fillRect(Math.round(x - 17), Math.round(y + 6), 34, 12)
  ctx.fillStyle = preview ? '#8a8074' : '#7a7268'
  ctx.fillRect(Math.round(x - 15), Math.round(y + 7), 30, 4)
  ctx.strokeStyle = '#1a1423'
  ctx.lineWidth = 2
  ctx.strokeRect(Math.round(x - 17), Math.round(y + 6), 34, 12)
}

function drawTowers(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const t of snap.towers) {
    const sprite = getTowerSprite(t.kind)
    const scale = getTowerScale(t.level)
    if (t.id === snap.selectedTowerId) {
      ctx.fillStyle = 'rgba(241, 196, 15, 0.22)'
      ctx.fillRect(t.col * CELL, t.row * CELL, CELL, CELL)
      ctx.strokeStyle = '#f1c40f'
      ctx.lineWidth = 2
      ctx.strokeRect(t.col * CELL + 1, t.row * CELL + 1, CELL - 2, CELL - 2)
    }
    drawTowerFoundation(ctx, t.x, t.y)
    drawPixelSprite(ctx, sprite, t.x + 1, t.y - 1, scale, 0.35)
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

    drawPixelSprite(ctx, sprite, Math.round(e.x), Math.round(e.y + bob), scale)

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

function drawSpawnAndEnd(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  const start = PATH_WAYPOINTS[0]
  const tanIn = pathTangentAtStart()
  const hx = start.x - tanIn.dx * 20
  const hy = start.y - tanIn.dy * 20 - 4

  ctx.fillStyle = 'rgba(8, 6, 4, 0.35)'
  ctx.beginPath()
  ctx.ellipse(hx, hy + 6, 22, 16, 0, 0, Math.PI * 2)
  ctx.fill()
  drawPixelSprite(ctx, getHoleMarker(), hx, hy, 2.2)

  const tanEnd = pathTangentAtEnd()
  const goal = goalAnchor()
  const cx = goal.x + tanEnd.dx * 10
  const cy = goal.y + tanEnd.dy * 10 - 10
  const flash = snap.time < snap.goalFlashUntil

  ctx.fillStyle = 'rgba(200, 90, 40, 0.14)'
  ctx.beginPath()
  ctx.arc(cx, cy + 8, 28, 0, Math.PI * 2)
  ctx.fill()

  drawPixelSprite(ctx, getCampMarker(), cx, cy, 2.25)

  if (flash) {
    ctx.fillStyle = 'rgba(255, 150, 70, 0.45)'
    ctx.beginPath()
    ctx.arc(cx, cy + 6, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffb07a'
    ctx.fillRect(Math.round(cx - 3), Math.round(cy + 4), 6, 6)
  }
}
