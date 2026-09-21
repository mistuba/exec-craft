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
  drawGrid(ctx, snap, hoverCell)
  drawPath(ctx)
  drawTowers(ctx, snap)
  drawEnemies(ctx, snap)
  drawProjectiles(ctx, snap)
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

function drawGrid(
  ctx: CanvasRenderingContext2D,
  snap: GameSnapshot,
  hover: { col: number; row: number } | null,
): void {
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

  if (hover && BUILD_GRID[hover.row]?.[hover.col] === 0) {
    const x = hover.col * CELL
    const y = hover.row * CELL
    const occupied = snap.towers.some((t) => t.col === hover.col && t.row === hover.row)
    if (snap.buildKind && !occupied) {
      const def = TOWER_DEFS[snap.buildKind]
      const stats = def.levels[0]
      ctx.fillStyle = 'rgba(46, 204, 113, 0.25)'
      ctx.fillRect(x, y, CELL, CELL)
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)'
      ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4)
      ctx.beginPath()
      ctx.arc(x + CELL / 2, y + CELL / 2, stats.range, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.35)'
      ctx.stroke()
    } else if (occupied) {
      ctx.fillStyle = 'rgba(241, 196, 15, 0.2)'
      ctx.fillRect(x, y, CELL, CELL)
    }
  }

  const sel = snap.towers.find((t) => t.id === snap.selectedTowerId)
  if (sel) {
    const def = TOWER_DEFS[sel.kind]
    const stats = def.levels[sel.level - 1]
    ctx.beginPath()
    ctx.arc(sel.x, sel.y, stats.range, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(241, 196, 15, 0.08)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.45)'
    ctx.stroke()
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
    ctx.fillStyle = def.color
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
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
