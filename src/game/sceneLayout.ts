import {
  CAMP_FIRE_PX,
  CAMP_GATE_PX,
  HOLE_MOUTH_PX,
  SCENE_MARKER_SCALE,
  getCampMarker,
  getHoleMarker,
  spritePointToWorld,
} from '../art/sceneMarkers'
import { goalAnchor, PATH_WAYPOINTS } from './path'

function centerForAnchor(
  worldX: number,
  worldY: number,
  anchorPx: { x: number; y: number },
  sprite: { width: number; height: number },
  scale: number,
): { x: number; y: number } {
  return {
    x: worldX - scale * (anchorPx.x - sprite.width / 2),
    y: worldY - scale * (anchorPx.y - sprite.height / 2),
  }
}

export function holeDrawCenter(): { x: number; y: number } {
  const start = PATH_WAYPOINTS[0]
  const sprite = getHoleMarker()
  return centerForAnchor(start.x, start.y, HOLE_MOUTH_PX, sprite, SCENE_MARKER_SCALE)
}

export function campDrawCenter(): { x: number; y: number } {
  const goal = goalAnchor()
  const sprite = getCampMarker()
  return centerForAnchor(goal.x, goal.y, CAMP_GATE_PX, sprite, SCENE_MARKER_SCALE)
}

export function campFireWorld(): { x: number; y: number } {
  const c = campDrawCenter()
  const sprite = getCampMarker()
  return spritePointToWorld(c.x, c.y, CAMP_FIRE_PX.x, CAMP_FIRE_PX.y, SCENE_MARKER_SCALE, sprite)
}
