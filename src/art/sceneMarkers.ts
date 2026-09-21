import { CELL } from '../config/level1'
import { ROAD_EDGE, ROAD_PX, roadFillAtWorld } from './roadAutotile'
import type { SpriteCanvas } from './pixelArt'

const CAVITY = '#070604'
const CAVITY_LIP = '#14110e'

/** 约 2×2；左缘贴画布，开口朝右接到土路 */
export const CAVE_ORIGIN = { x: 0, y: CELL - ROAD_PX * 4 }

/** 约 2×2；开口朝左，贴在路尽头右侧 */
export const GATE_ORIGIN = { x: 16 * CELL, y: 10 * CELL - ROAD_PX * 4 }

/** 门后几像素火光（开口里、路的右缘） */
export const GATE_FIRE = { x: 714, y: 418 }

/**
 * 树洞：左缘贴边，厚土壁，黑腔在内部，右侧开口接路。
 * e=描边 D=填充 n=洞腔 N=洞唇
 */
const caveRows = [
  'eeeeeeeeee......',
  'eDDDDDDDDDee....',
  'eDDDDDDDDDDDe...',
  'eDDDDDeeeeDDDe..',
  'eDDDDennnnneDe..',
  'eDDennnnnnnneeee',
  'eDnnnnnnnnnN....',
  'eDnnnnnnnnnN....',
  'eDnnnnnnnnnN....',
  'eDnnnnnnnnnN....',
  'eDDennnnnnnneeee',
  'eDDDDennnnneDe..',
  'eDDDDDeeeeDDDe..',
  'eDDDDDDDDDDDe...',
  'eDDDDDDDDDee....',
  'eeeeeeeeee......',
]

/**
 * 木门：上门楣 + 左右两柱。路的高度整行留空，怪从左边走进去。
 * 南侧连成一座，避免再看成朝下的开口或套在路上的木环。
 */
const gateRows = [
  '......eeeeeeeeee',
  '.....eDDDDDDDDDe',
  '.....eDDDDDDDDDe',
  '.....eDDee.eDDDe',
  '.....eDe.....eDe',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....eDe.....eDe',
  '.....eDDee.eDDDe',
  '.....eDDDDDDDDDe',
  '.....eDDDDDDDDDe',
  '......eeeeeeeeee',
]

let caveBack: SpriteCanvas | null = null
let caveFront: SpriteCanvas | null = null
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

function paintCharmap(
  rows: string[],
  originX: number,
  originY: number,
  keep: string,
): SpriteCanvas {
  const px = ROAD_PX
  const canvas = document.createElement('canvas')
  canvas.width = rows[0].length * px
  canvas.height = rows.length * px
  const ctx = canvas.getContext('2d')!
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (!keep.includes(ch)) continue
      const color = charColor(ch, originX + x * px, originY + y * px)
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x * px, y * px, px, px)
    }
  }
  return canvas
}

function getCaveBack(): SpriteCanvas {
  if (!caveBack) caveBack = paintCharmap(caveRows, CAVE_ORIGIN.x, CAVE_ORIGIN.y, 'nN')
  return caveBack
}

function getCaveFront(): SpriteCanvas {
  if (!caveFront) caveFront = paintCharmap(caveRows, CAVE_ORIGIN.x, CAVE_ORIGIN.y, 'eD')
  return caveFront
}

function getGateSprite(): SpriteCanvas {
  if (!gateSprite) gateSprite = paintCharmap(gateRows, GATE_ORIGIN.x, GATE_ORIGIN.y, 'eD')
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

/** 洞腔 + 门后火：画在怪下面，怪从黑洞里走出来 */
export function drawRoadTerminalsBack(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(getCaveBack(), CAVE_ORIGIN.x, CAVE_ORIGIN.y)
  drawIdleFire(ctx)
  ctx.restore()
}

/** 洞壁 + 门框：画在怪上面，遮住洞壁上的穿模 */
export function drawRoadTerminalsFront(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(getCaveFront(), CAVE_ORIGIN.x, CAVE_ORIGIN.y)
  ctx.drawImage(getGateSprite(), GATE_ORIGIN.x, GATE_ORIGIN.y)
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
