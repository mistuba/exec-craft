import { BUILD_GRID, CELL, COLS, ROWS } from '../config/level1'

export interface Point {
  x: number
  y: number
}

function isRoad(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS && BUILD_GRID[row][col] === 1
}

function cellCenter(row: number, col: number): Point {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 }
}

function key(row: number, col: number): string {
  return `${row},${col}`
}

function neighbors(row: number, col: number): [number, number][] {
  const out: [number, number][] = []
  for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
    const nr = row + dr
    const nc = col + dc
    if (isRoad(nr, nc)) out.push([nr, nc])
  }
  return out
}

function findEndpoints(): [number, number][] {
  const ends: [number, number][] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!isRoad(row, col)) continue
      if (neighbors(row, col).length === 1) ends.push([row, col])
    }
  }
  return ends
}

function bfsDistances(start: [number, number]): Map<string, number> {
  const dist = new Map<string, number>()
  const q: [number, number][] = [start]
  dist.set(key(start[0], start[1]), 0)
  while (q.length > 0) {
    const [r, c] = q.shift()!
    const d = dist.get(key(r, c))!
    for (const [nr, nc] of neighbors(r, c)) {
      const k = key(nr, nc)
      if (!dist.has(k)) {
        dist.set(k, d + 1)
        q.push([nr, nc])
      }
    }
  }
  return dist
}

function bfsPath(start: [number, number], end: [number, number]): [number, number][] {
  const prev = new Map<string, [number, number] | null>()
  const q: [number, number][] = [start]
  prev.set(key(start[0], start[1]), null)

  while (q.length > 0) {
    const [r, c] = q.shift()!
    if (r === end[0] && c === end[1]) break
    for (const [nr, nc] of neighbors(r, c)) {
      const k = key(nr, nc)
      if (!prev.has(k)) {
        prev.set(k, [r, c])
        q.push([nr, nc])
      }
    }
  }

  const cells: [number, number][] = []
  let cur: [number, number] | null = end
  const endK = key(end[0], end[1])
  if (!prev.has(endK)) return [start]

  while (cur) {
    cells.push(cur)
    cur = prev.get(key(cur[0], cur[1])) ?? null
  }
  cells.reverse()
  return cells
}

function simplifyCollinear(points: Point[]): Point[] {
  if (points.length <= 2) return points
  const out: Point[] = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1]
    const b = points[i]
    const c = points[i + 1]
    const v1x = b.x - a.x
    const v1y = b.y - a.y
    const v2x = c.x - b.x
    const v2y = c.y - b.y
    if (v1x * v2y - v1y * v2x !== 0) out.push(b)
  }
  out.push(points[points.length - 1])
  return out
}

/** 沿道路格子 BFS 求从入口到出口的中心线拐点 */
export function buildRoadWaypoints(): Point[] {
  const ends = findEndpoints()
  if (ends.length === 0) return [cellCenter(1, 0)]

  ends.sort((a, b) => a[0] * 1000 + a[1] - (b[0] * 1000 + b[1]))
  const start = ends[0]
  const dist = bfsDistances(start)

  let end = ends[ends.length - 1]
  let best = -1
  for (const e of ends) {
    const d = dist.get(key(e[0], e[1])) ?? 0
    if (d > best) {
      best = d
      end = e
    }
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!isRoad(row, col)) continue
      const d = dist.get(key(row, col)) ?? 0
      if (d > best) {
        best = d
        end = [row, col]
      }
    }
  }

  const cells = bfsPath(start, end)
  const points = cells.map(([r, c]) => cellCenter(r, c))
  return simplifyCollinear(points)
}
