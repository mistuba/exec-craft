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
  ctx.clearRect(0, 0, MAP_W, MAP_H)

  drawBackground(ctx)
  drawRoadCells(ctx)
  drawPath(ctx)
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

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, MAP_H)
  g.addColorStop(0, '#1a2f1a')
  g.addColorStop(1, '#0f1a12')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, MAP_W, MAP_H)

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * CELL
      const y = row * CELL
      if (BUILD_GRID[row][col] === 0) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#243d28' : '#203522'
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
      }
    }
  }
}

function drawRoadCells(ctx: CanvasRenderingContext2D): void {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (BUILD_GRID[row][col] === 1) {
        const x = col * CELL
        const y = row * CELL
        ctx.fillStyle = '#5c4a32'
        ctx.fillRect(x, y, CELL, CELL)
        ctx.strokeStyle = '#3d2f1f'
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1)
      }
    }
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
      drawRangeCircle(ctx, cx, cy, stats.range, 'rgba(46, 204, 113, 0.1)', 'rgba(46, 204, 113, 0.65)')
    }
  }

  const sel = snap.towers.find((t) => t.id === snap.selectedTowerId)
  if (sel) {
    const def = TOWER_DEFS[sel.kind]
    const stats = def.levels[sel.level - 1]
    drawRangeCircle(ctx, sel.x, sel.y, stats.range, 'rgba(241, 196, 15, 0.12)', 'rgba(241, 196, 15, 0.75)')
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
  ctx.setLineDash([6, 5])
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
    ctx.fillStyle = 'rgba(46, 204, 113, 0.28)'
    ctx.fillRect(x, y, CELL, CELL)
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.9)'
    ctx.lineWidth = 2
    ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4)
  } else if (occupied) {
    ctx.fillStyle = 'rgba(241, 196, 15, 0.22)'
    ctx.fillRect(x, y, CELL, CELL)
  }
}

function drawPath(ctx: CanvasRenderingContext2D): void {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 22
  ctx.strokeStyle = '#8b7355'
  ctx.beginPath()
  ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y)
  for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
    ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y)
  }
  ctx.stroke()

  ctx.lineWidth = 10
  ctx.strokeStyle = '#c4a574'
  ctx.stroke()
}

function drawTowers(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const t of snap.towers) {
    const def = TOWER_DEFS[t.kind]
    const r = 14
    ctx.fillStyle = def.color
    ctx.strokeStyle = def.accent
    ctx.lineWidth = 3
    if (t.id === snap.selectedTowerId) {
      ctx.shadowColor = '#f1c40f'
      ctx.shadowBlur = 12
    }
    if (t.kind === 'bolt') {
      ctx.beginPath()
      ctx.moveTo(t.x, t.y - r)
      ctx.lineTo(t.x + r, t.y + r * 0.8)
      ctx.lineTo(t.x - r, t.y + r * 0.8)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (t.kind === 'frost') {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        const px = t.x + Math.cos(a) * r
        const py = t.y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(def.icon, t.x, t.y)
    if (t.level === 2) {
      ctx.fillStyle = '#f1c40f'
      ctx.beginPath()
      ctx.arc(t.x + 10, t.y - 12, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawCorpses(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const c of snap.corpses) {
    const def = ENEMY_DEFS[c.kind]
    const alpha = Math.max(0, c.life / c.maxLife)
    const scale = 0.55 + 0.45 * alpha
    ctx.globalAlpha = alpha * 0.85
    ctx.fillStyle = '#2c2c2c'
    ctx.beginPath()
    ctx.ellipse(c.x, c.y + 4, def.radius * scale, def.radius * 0.45 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

function drawEnemies(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  for (const e of snap.enemies) {
    const def = ENEMY_DEFS[e.kind]
    const slowed = e.slowUntil > snap.time
    ctx.fillStyle = slowed ? '#a8d8ff' : def.color
    ctx.strokeStyle = def.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(e.x, e.y, def.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    const w = def.radius * 2
    const hpRatio = Math.max(0, e.hp / e.maxHp)
    ctx.fillStyle = '#222'
    ctx.fillRect(e.x - w / 2, e.y - def.radius - 8, w, 4)
    ctx.fillStyle = hpRatio > 0.35 ? '#2ecc71' : '#e74c3c'
    ctx.fillRect(e.x - w / 2, e.y - def.radius - 8, w * hpRatio, 4)
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
    ctx.lineWidth = p.towerKind === 'bolt' ? 3 : p.towerKind === 'frost' ? 4 : 5
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.shadowColor = def.color
    ctx.shadowBlur = p.towerKind === 'ember' ? 14 : 8
    ctx.fillStyle = def.color
    if (p.towerKind === 'bolt') {
      ctx.beginPath()
      ctx.moveTo(x + 6, y)
      ctx.lineTo(x - 4, y - 4)
      ctx.lineTo(x - 2, y)
      ctx.lineTo(x - 4, y + 4)
      ctx.closePath()
      ctx.fill()
    } else if (p.towerKind === 'frost') {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#dff9ff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0
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
    ctx.beginPath()
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function drawFloats(ctx: CanvasRenderingContext2D, snap: GameSnapshot): void {
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.textAlign = 'center'
  for (const f of snap.floats) {
    ctx.globalAlpha = Math.min(1, f.life)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, f.x, f.y - (1.2 - f.life) * 28)
    ctx.globalAlpha = 1
  }
}

function drawSpawnAndEnd(ctx: CanvasRenderingContext2D): void {
  const s = PATH_WAYPOINTS[0]
  const e = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1]
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillStyle = '#a8e6cf'
  ctx.fillText('入口', s.x, s.y - 18)
  ctx.fillStyle = '#ffb3b3'
  ctx.fillText('营地', e.x - 24, e.y + 4)
}
