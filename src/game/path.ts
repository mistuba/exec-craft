import { buildRoadWaypoints } from './roadPath'

export const PATH_WAYPOINTS = buildRoadWaypoints()

/** 怪从洞腔内侧走出（画布内的黑洞里，不从左缘外冒出来） */
export const SPAWN_BACK = 6

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
  if (dist < 0 && PATH_WAYPOINTS.length >= 2) {
    const a = PATH_WAYPOINTS[0]
    const b = PATH_WAYPOINTS[1]
    const seg = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const ux = (a.x - b.x) / seg
    const uy = (a.y - b.y) / seg
    const back = -dist
    return {
      x: a.x + ux * back,
      y: a.y + uy * back,
      segIndex: 0,
      t: dist / seg,
    }
  }

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

export function pathTangentAtStart(): { dx: number; dy: number } {
  const a = PATH_WAYPOINTS[0]
  const b = PATH_WAYPOINTS[1]
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { dx: (b.x - a.x) / len, dy: (b.y - a.y) / len }
}

export function pathTangentAtEnd(): { dx: number; dy: number } {
  const n = PATH_WAYPOINTS.length
  const a = PATH_WAYPOINTS[n - 2]
  const b = PATH_WAYPOINTS[n - 1]
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { dx: (b.x - a.x) / len, dy: (b.y - a.y) / len }
}

export function goalAnchor(): { x: number; y: number } {
  const end = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1]
  const tan = pathTangentAtEnd()
  return { x: end.x + tan.dx * 6, y: end.y + tan.dy * 6 }
}

export function holeAnchor(): { x: number; y: number } {
  const pos = positionAtDistance(-SPAWN_BACK * 0.55)
  return { x: pos.x, y: pos.y - 8 }
}
