import { CELL } from '../config/level1'
import { ROAD_EDGE, ROAD_PX, roadFillAtWorld } from './roadAutotile'
import type { SpriteCanvas } from './pixelArt'

const CAVITY = '#070604'
const CAVITY_LIP = '#14110e'

/** 约 2×2；左缘完整在画布内，开口朝右接到土路 */
export const CAVE_ORIGIN = { x: ROAD_PX, y: CELL - ROAD_PX * 4 }

/** 约 2×2；开口朝左，略伸出右缘，避开上方弯道格 */
export const GATE_ORIGIN = { x: 16 * CELL + ROAD_PX * 2, y: 10 * CELL - ROAD_PX * 4 }

/** 门后几像素火光，贴在画布右缘 */
export const GATE_FIRE = { x: 717, y: 418 }

/**
 * 树洞/石窟：厚土壁 C 形，黑只在洞口里，右侧开口接路。
 * e=路描边 D=路填充 n=近黑洞腔 N=洞口唇
 */
const caveRows = [
  '..eeeeeeeeee....',
  '.eDDDDDDDDDDee..',
  'eDDDDDDDDDDDDe..',
  'eDDDDDeeeeeDDDe.',
  'eDDDDeennnneDDe.',
  'eDDDDennnnnneeee',
  'eDDDDnnnnnnN....',
  'eDDDDnnnnnnN....',
  'eDDDDnnnnnnN....',
  'eDDDDnnnnnnN....',
  'eDDDDennnnnneeee',
  'eDDDDeennnneDDe.',
  'eDDDDDeeeeeDDDe.',
  'eDDDDDDDDDDDDe..',
  '.eDDDDDDDDDDee..',
  '..eeeeeeeeee....',
]

/**
 * 空心木门：两柱 + 上门楣，中间完全空，怪从路走进去。
 * 不封底、不填开口，避免再画成木箱。
 */
const gateRows = [
  '..eeeeeeeeeeee..',
  '.eDDDDDDDDDDDDe.',
  '.eDDDDDDDDDDDDe.',
  '.eDDDee..eeDDDe.',
  '.eDDe......eDDe.',
  '.eDe........eDe.',
  '.ee..........ee.',
  '................',
  '................',
  '.ee..........ee.',
  '.eDe........eDe.',
  '.eDDe......eDDe.',
  '.eDDDee..eeDDDe.',
  '.eDDDD....DDDDe.',
  '.eDDDD....DDDDe.',
  '..eeee....eeee..',
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

function assertMaps(): void {
  for (const [name, rows] of [
    ['cave', caveRows],
    ['gate', gateRows],
  ] as const) {
    if (rows.length !== 16 || rows.some((r) => r.length !== 16)) {
      throw new Error(`${name} terminal map must be 16×16`)
    }
  }
}
assertMaps()

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
  ctx.fillStyle = '#b84a22'
  ctx.fillRect(x, y + 1, 2, 1)
  ctx.fillStyle = '#e07038'
  ctx.fillRect(x, y - 1, 2, 2)
  ctx.fillStyle = '#f0c070'
  ctx.fillRect(x + 1, y - 1, 1, 1)
}

export function drawGoalFireFlash(ctx: CanvasRenderingContext2D, intensity: number): void {
  const { x, y } = GATE_FIRE
  ctx.save()
  ctx.globalAlpha = 0.65 + intensity * 0.35
  ctx.fillStyle = '#ffb07a'
  ctx.fillRect(x - 1, y - 3, 4, 4)
  ctx.fillStyle = '#e87840'
  ctx.fillRect(x, y - 2, 2, 3)
  ctx.fillStyle = '#fff0d0'
  ctx.fillRect(x + 1, y - 2, 1, 1)
  ctx.restore()
}
