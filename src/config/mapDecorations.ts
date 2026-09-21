import { BUILD_GRID, CELL, COLS, ROWS } from './level1'
import type { DebrisKind } from '../art/debrisSprites'

export interface MapDecoration {
  kind: DebrisKind
  x: number
  y: number
  scale: number
}

/** 固定散布，避免压在道路上；坐标可跨格 */
export const MAP_DECORATIONS: MapDecoration[] = [
  { kind: 'bush', x: 52, y: 28, scale: 2.4 },
  { kind: 'pebbles', x: 198, y: 42, scale: 2.2 },
  { kind: 'fern', x: 318, y: 52, scale: 2.5 },
  { kind: 'log', x: 468, y: 36, scale: 2.35 },
  { kind: 'rock', x: 588, y: 68, scale: 2.1 },
  { kind: 'stump', x: 92, y: 152, scale: 2.3 },
  { kind: 'pebbles', x: 228, y: 248, scale: 2.0 },
  { kind: 'fern', x: 352, y: 268, scale: 2.4 },
  { kind: 'bush', x: 512, y: 312, scale: 2.5 },
  { kind: 'rock', x: 648, y: 368, scale: 2.15 },
  { kind: 'log', x: 168, y: 388, scale: 2.2 },
  { kind: 'stump', x: 428, y: 412, scale: 2.25 },
  { kind: 'pebbles', x: 548, y: 88, scale: 1.95 },
  { kind: 'fern', x: 72, y: 328, scale: 2.35 },
  { kind: 'rock', x: 302, y: 188, scale: 2.05 },
]

function onGrassPixel(x: number, y: number): boolean {
  const col = Math.floor(x / CELL)
  const row = Math.floor(y / CELL)
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false
  return BUILD_GRID[row][col] === 0
}

/** 剔除中心落在道路上的装饰（保留边界草地的碎屑） */
export function activeDecorations(): MapDecoration[] {
  return MAP_DECORATIONS.filter((d) => onGrassPixel(d.x, d.y))
}
