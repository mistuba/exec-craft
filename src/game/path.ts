import { PATH_WAYPOINTS } from '../config/level1'

export function pathLength(): number {
  let len = 0
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const a = PATH_WAYPOINTS[i]
    const b = PATH_WAYPOINTS[i + 1]
    len += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return len
}

export function positionAtDistance(dist: number): { x: number; y: number; segIndex: number; t: number } {
  let remaining = dist
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const a = PATH_WAYPOINTS[i]
    const b = PATH_WAYPOINTS[i + 1]
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        segIndex: i,
        t,
      }
    }
    remaining -= seg
  }
  const last = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1]
  return { x: last.x, y: last.y, segIndex: PATH_WAYPOINTS.length - 2, t: 1 }
}

export function distanceAlongPath(segIndex: number, t: number): number {
  let dist = 0
  for (let i = 0; i < segIndex; i++) {
    const a = PATH_WAYPOINTS[i]
    const b = PATH_WAYPOINTS[i + 1]
    dist += Math.hypot(b.x - a.x, b.y - a.y)
  }
  const a = PATH_WAYPOINTS[segIndex]
  const b = PATH_WAYPOINTS[segIndex + 1]
  dist += Math.hypot(b.x - a.x, b.y - a.y) * t
  return dist
}
