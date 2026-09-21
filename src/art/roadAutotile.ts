import { BUILD_GRID, CELL, COLS, ROWS } from '../config/level1'
import type { SpriteCanvas } from './pixelArt'

const SIZE = 8

const DIRT = ['#a89470', '#9c8864', '#b0a074'] as const
const EDGE = '#5a4830'
const GRASS = ['#4a9848', '#449044', '#52a050'] as const

/** 与土路格同一套：描边色、填充、线宽（1 源像素 × 放大） */
export const ROAD_EDGE = EDGE
export const ROAD_PX = CELL / SIZE

export function roadFillAtWorld(wx: number, wy: number): string {
  return dirtAtWorld(Math.floor(wx / ROAD_PX), Math.floor(wy / ROAD_PX))
}

const tileCache = new Map<number, SpriteCanvas>()

function isRoadCell(row: number, col: number): boolean {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false
  return BUILD_GRID[row][col] === 1
}

/** 北东南西是否为路（出界视为草，会画草边） */
export function roadNeighborMask(row: number, col: number): number {
  let mask = 0
  if (isRoadCell(row - 1, col)) mask |= 1
  if (isRoadCell(row, col + 1)) mask |= 2
  if (isRoadCell(row + 1, col)) mask |= 4
  if (isRoadCell(row, col - 1)) mask |= 8
  return mask
}

function grassTooth(t: number, row: number, col: number, side: number): string {
  const h = (row * 131 + col * 97 + t * 17 + side * 43) >>> 0
  if (h % 5 === 0) return GRASS[h % GRASS.length]
  if (h % 7 === 0) return EDGE
  return GRASS[(h >> 2) % GRASS.length]
}

function dirtAtWorld(gx: number, gy: number): string {
  const h = (gx * 73 + gy * 51) >>> 0
  return DIRT[h % DIRT.length]
}

function colorAt(
  x: number,
  y: number,
  mask: number,
  row: number,
  col: number,
): string {
  const nRoad = (mask & 1) !== 0
  const eRoad = (mask & 2) !== 0
  const sRoad = (mask & 4) !== 0
  const wRoad = (mask & 8) !== 0
  const gx = col * SIZE + x
  const gy = row * SIZE + y

  if (!nRoad) {
    if (y === 0) return grassTooth(x, row, col, 0)
    if (y === 1) return EDGE
  }
  if (!sRoad) {
    if (y === SIZE - 1) return grassTooth(x, row, col, 1)
    if (y === SIZE - 2) return EDGE
  }
  if (!wRoad) {
    if (x === 0) return grassTooth(y, row, col, 2)
    if (x === 1) return EDGE
  }
  if (!eRoad) {
    if (x === SIZE - 1) return grassTooth(y, row, col, 3)
    if (x === SIZE - 2) return EDGE
  }

  return dirtAtWorld(gx, gy)
}

function buildTile(mask: number, row: number, col: number): SpriteCanvas {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = colorAt(x, y, mask, row, col)
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return canvas
}

/** 按邻接掩码生成满格土路贴图（仅草边描边，路路之间无缝） */
export function getRoadAutotile(row: number, col: number): SpriteCanvas {
  const key = row * COLS + col
  const cached = tileCache.get(key)
  if (cached) return cached

  const tile = buildTile(roadNeighborMask(row, col), row, col)
  tileCache.set(key, tile)
  return tile
}
