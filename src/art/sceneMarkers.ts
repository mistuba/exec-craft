import { CELL } from '../config/level1'
import { ROAD_EDGE, ROAD_PX, roadFillAtWorld } from './roadAutotile'
import type { SpriteCanvas } from './pixelArt'

const CAVITY = '#070604'
const CAVITY_LIP = '#12100c'

/** 约 2×2；左缘完整在画布内，开口朝右接到土路 */
export const CAVE_ORIGIN = { x: ROAD_PX, y: CELL - ROAD_PX * 4 }

/** 约 2×2；开口朝左，可略伸出右缘，避开上方弯道格 */
export const GATE_ORIGIN = { x: 16 * CELL + ROAD_PX * 4, y: 10 * CELL - ROAD_PX * 4 }

/** 门后几像素火光，贴在画布右缘内侧 */
export const GATE_FIRE = { x: 716, y: 418 }

const caveRows = [
  '...eeeeeeeeee...',
  '.eeDDDDDDDDDDee.',
  '.eDDDDDDDDDDDDe.',
  'eDDDeeeeeeeeDDe.',
  'eDDennnnnnnneDe.',
  'eDennnnnnnnnneee',
  'eDDnnnnnnnnN....',
  'eDDnnnnnnnnN....',
  'eDDnnnnnnnnN....',
  'eDDnnnnnnnnN....',
  'eDennnnnnnnnneee',
  'eDDennnnnnnneDe.',
  'eDDDeeeeeeeeDDe.',
  '.eDDDDDDDDDDDDe.',
  '.eeDDDDDDDDDDee.',
  '...eeeeeeeeee...',
]

const gateRows = [
  '....eeeeeeeeee..',
  '...eDDDDDDDDDDe.',
  '...eDDDDDDDDDDe.',
  '...eDDDe.eDDDe..',
  '....eDe...eDe...',
  '....ee....ee....',
  '..........DD....',
  '..........DD....',
  '..........DD....',
  '..........DD....',
  '....ee....ee....',
  '....eDe...eDe...',
  '...eDDDe.eDDDe..',
  '....eDD...eDD...',
  '....eDD...eDD...',
  '....ee....ee....',
]

let caveSprite: SpriteCanvas | null = null
let gateSprite: SpriteCanvas | null = null

function charColor(ch: string, wx: number, wy: number): string | null {
  switch (ch) {
    case 'e':
      return ROAD_EDGE
    case 'D':
      return roadFillAtWorld(wx, wy)
    case 'n':
      return CAVITY
    case 'N':
      return CAVITY_LIP
    default:
      return null
  }
}

function paintCharmap(rows: string[], originX: number, originY: number): SpriteCanvas {
  const px = ROAD_PX
  const canvas = document.createElement('canvas')
  canvas.width = rows[0].length * px
  canvas.height = rows.length * px
  const ctx = canvas.getContext('2d')!
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]
    for (let x = 0; x < row.length; x++) {
      const color = charColor(row[x], originX + x * px, originY + y * px)
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x * px, y * px, px, px)
    }
  }
  return canvas
}

function getCaveSprite(): SpriteCanvas {
  if (!caveSprite) caveSprite = paintCharmap(caveRows, CAVE_ORIGIN.x, CAVE_ORIGIN.y)
  return caveSprite
}

function getGateSprite(): SpriteCanvas {
  if (!gateSprite) gateSprite = paintCharmap(gateRows, GATE_ORIGIN.x, GATE_ORIGIN.y)
  return gateSprite
}

/** 土路两端接头：树洞口 / 空心木门（与路同色同线宽） */
export function drawRoadTerminals(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(getCaveSprite(), CAVE_ORIGIN.x, CAVE_ORIGIN.y)
  ctx.drawImage(getGateSprite(), GATE_ORIGIN.x, GATE_ORIGIN.y)
  drawIdleFire(ctx)
  ctx.restore()
}

function drawIdleFire(ctx: CanvasRenderingContext2D): void {
  const { x, y } = GATE_FIRE
  ctx.fillStyle = '#c45a28'
  ctx.fillRect(x - 1, y + 1, 3, 2)
  ctx.fillStyle = '#e87840'
  ctx.fillRect(x, y, 2, 2)
  ctx.fillStyle = '#f0c070'
  ctx.fillRect(x + 1, y, 1, 1)
}

export function drawGoalFireFlash(ctx: CanvasRenderingContext2D, intensity: number): void {
  const { x, y } = GATE_FIRE
  ctx.save()
  ctx.globalAlpha = 0.55 + intensity * 0.45
  ctx.fillStyle = '#ffb07a'
  ctx.fillRect(x - 2, y - 3, 5, 4)
  ctx.fillStyle = '#e87840'
  ctx.fillRect(x - 1, y - 2, 3, 3)
  ctx.fillStyle = '#fff0d0'
  ctx.fillRect(x, y - 2, 1, 1)
  ctx.restore()
}

