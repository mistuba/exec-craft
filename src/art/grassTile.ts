import type { SpriteCanvas } from './pixelArt'

const SIZE = 8

const BASE = ['#4a9848', '#489648', '#4c9a4a'] as const
const BLOT = ['#529e50', '#449044', '#54a052'] as const

const variantCache = new Map<number, SpriteCanvas>()

/** 低对比、略不规则的草地（避免棋盘墙纸感） */
export function getGrassTile(row: number, col: number): SpriteCanvas {
  const variant = ((row * 17 + col * 31) & 3) + ((row * col) % 2) * 4
  const cached = variantCache.get(variant)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const h = (row * 928371 + col * 689287 + x * 23 + y * 41) >>> 0
      let color: string = BASE[h % BASE.length]
      const blot = (h % 19) / 19
      if (blot > 0.72) color = BLOT[(h >> 3) % BLOT.length]
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }

  variantCache.set(variant, canvas)
  return canvas
}
