import { CELL } from '../config/level1'
import { buildSprite, type SpriteCanvas } from './pixelArt'

const P = {
  o: '#1a1423',
  n: '#060504',
  N: '#100e0c',
  W: '#4a3828',
  w: '#5c4834',
  H: '#3a5230',
  h: '#2d4226',
  T: '#6b5a40',
  t: '#7a6848',
  K: '#5a4a38',
  k: '#4a3c30',
  R: '#b84a28',
  r: '#d06030',
  O: '#e87840',
  A: '#6b4028',
  a: '#5a3420',
}

/** 约 2×2 格；洞口在精灵右侧，路向东接出 */
export const MARKER_HOLE = buildSprite(
  [
    '....oooooooooooooooooooooooo....',
    '..ooHHHHHHWWWWWWWWHHHHHHHHoo..',
    '.oHHHHHHHHWWWWWWWWWWHHHHHHHHo.',
    'oHHHHHHHHHWWWWWWWWWWHHHHHHHHHo',
    'oHHHHWWhhWWNNNNNNWWhhWHHHHHHo',
    'oHHWWhhhWWWnnnnnnWWWhhhWHHHHo',
    'oHHWWhhhWWWnnnnnnWWWhhhWHHHHo',
    'oHHWWhhhWWWnnnnnnWWWhhhWHHHHo',
    'oHHHHWWhhWWNNNNNNWWhhWHHHHHHo',
    'oHHHHHHHHHWWWWWWWWWWHHHHHHHHHo',
    'oHHHHHHHHHWWWWWWWWWWHHHHHHHHHo',
    '.oHHHHHHHHWWWWWWWWWWHHHHHHHHo.',
    '..ooHHHHHHWWWWWWWWHHHHHHHHoo..',
    '....oooooooooooooooooooooooo....',
  ],
  P,
  'marker-hole-v3',
)

/** 木门桩 + 篝火；门洞居中，火在门后偏下（小像素焰） */
export const MARKER_CAMP = buildSprite(
  [
    '....oooooooooooooooooooooooo....',
    '..ooWWWWWWWWWWWWWWWWWWWWWWoo..',
    '..oWWWWWWWWWWWWWWWWWWWWWWWWo..',
    '..oWWk.............kWWWWWWWo..',
    '..oWWk.............kWWWWWWWo..',
    '..oWWk.............kWWWWWWWo..',
    '..oWWk.............kWWWWWWWo..',
    '..oWWWWWWWWWWWWWWWWWWWWWWWWo..',
    '..oWWWWWWWWWWWWWWWWWWWWWWWWo..',
    '..oWWWWWWoAaKKKKoWWWWWWWWWo..',
    '..oWWWWWWorROoWWWWWWWWWWWWo..',
    '..oWWWWWWoAaKKKKoWWWWWWWWWo..',
    '..ooWWWWWWWWWWWWWWWWWWWWWWoo..',
    '....oooooooooooooooooooooooo....',
  ],
  P,
  'marker-camp-v3',
)

/** 精灵像素 → 世界坐标（scale 后，锚在精灵中心） */
export const SCENE_MARKER_SCALE = (CELL * 2) / 32

/** 洞口接路点：精灵右侧中部 */
export const HOLE_MOUTH_PX = { x: 30, y: 16 }

/** 门洞中心 */
export const CAMP_GATE_PX = { x: 16, y: 9 }

/** 篝火像素区域中心（用于漏怪闪烁） */
export const CAMP_FIRE_PX = { x: 18, y: 10 }

export function getHoleMarker(): SpriteCanvas {
  return MARKER_HOLE
}

export function getCampMarker(): SpriteCanvas {
  return MARKER_CAMP
}

export function spritePointToWorld(
  centerX: number,
  centerY: number,
  px: number,
  py: number,
  scale: number,
  sprite: SpriteCanvas,
): { x: number; y: number } {
  const left = centerX - (sprite.width * scale) / 2
  const top = centerY - (sprite.height * scale) / 2
  return { x: left + px * scale, y: top + py * scale }
}
