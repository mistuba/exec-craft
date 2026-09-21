import { BUILD_GRID, CELL, COLS, ROWS } from './level1'

export type DebrisKind = 'bush' | 'rock'

export interface MapDecoration {
  kind: DebrisKind
  x: number
  y: number
  scale: number
}

/** 少量草面装饰：非格心、不在路上 */
export const MAP_DECORATIONS: MapDecoration[] = [
  { kind: 'bush', x: 54, y: 26, scale: 2.35 },
  { kind: 'rock', x: 206, y: 38, scale: 2.1 },
  { kind: 'bush', x: 334, y: 58, scale: 2.2 },
  { kind: 'rock', x: 502, y: 34, scale: 2.05 },
  { kind: 'bush', x: 612, y: 72, scale: 2.25 },
  { kind: 'rock', x: 88, y: 168, scale: 2.15 },
  { kind: 'bush', x: 248, y: 262, scale: 2.3 },
  { kind: 'rock', x: 396, y: 286, scale: 2.0 },
]

export function activeDecorations(): MapDecoration[] {
  return MAP_DECORATIONS.filter((d) => {
    const col = Math.floor(d.x / CELL)
    const row = Math.floor(d.y / CELL)
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false
    return BUILD_GRID[row][col] === 0
  })
}
