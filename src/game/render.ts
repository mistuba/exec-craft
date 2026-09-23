import { getDebrisSprite } from '../art/debrisSprites'
import { getGrassTile } from '../art/grassTile'
import { getRoadAutotile } from '../art/roadAutotile'
import {
  getEnemyScale,
  getEnemySprite,
  getTowerScale,
  getTowerSprite,
} from '../art/sprites'
import { drawGoalFireFlash as flashGoalFire, drawRoadTerminalsBack, drawRoadTerminalsFront } from '../art/sceneMarkers'
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
  drawRoadTerminalsBack(ctx)
  drawRangeOverlays(ctx, snap, hoverCell)
  drawBuildHover(ctx, snap, hoverCell)
  drawTowers(ctx, snap)
  drawCorpses(ctx, snap)
  drawEnemies(ctx, snap)
  drawRoadTerminalsFront(ctx)
  drawProjectiles(ctx, snap)
  drawHitEffects(ctx, snap)
  drawFloats(ctx, snap)
  drawGoalFireFlash(ctx, snap)
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
      drawAttackPreview(ctx, cx, cy, stats.range, stats.splashRadius, 'rgba(88, 166, 255, 0.14)', 'rgba(136, 196, 255, 0.95)')
    }
  }

  const sel = snap.towers.find((t) => t.id === snap.selectedTowerId)
  if (sel) {
    const def = TOWER_DEFS[sel.kind]
    const stats = def.levels[sel.level - 1]
    drawAttackPreview(ctx, sel.x, sel.y, stats.range, stats.splashRadius, 'rgba(241, 196, 15, 0.14)', 'rgba(241, 196, 15, 0.9)')
  }
}

/** 外圈是射程；奥术余烬再画一圈命中灼烧范围，方便和单体塔区分。 */
function drawAttackPreview(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  range: number,
  splashRadius: number | undefined,
  fill: string,
  stroke: string,
): void {
  if (splashRadius) drawSplashZone(ctx, x, y, splashRadius, 0.28)
  drawRangeCircle(ctx, x, y, range, fill, stroke)
}

function drawSplashZone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
): void {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(232, 120, 64, ${alpha})`
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 196, 140, 0.95)'
  ctx.lineWidth = 2
  ctx.setLineDash([3, 3])
  ctx.stroke()
  ctx.setLineDash([])
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
    if (h.towerKind === 'ember') {
      const fade = 1 - t
      drawSplashZone(ctx, h.x, h.y, h.radius, 0.42 * fade)
      ctx.beginPath()
      ctx.arc(h.x, h.y, h.radius * (1 + t * 0.15), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 220, 180, ${0.85 * fade})`
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.stroke()
      continue
    }
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

function drawGoalFireFlash(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  if (snap.time >= snap.goalFlashUntil) return
  const t = 1 - (snap.goalFlashUntil - snap.time) / 0.55
  flashGoalFire(ctx, t)
}
