import { buildSprite, type SpriteCanvas } from './pixelArt'

const P = {
  o: '#1a1423',
  n: '#080604',
  N: '#12100c',
  W: '#4a3828',
  w: '#5c4834',
  H: '#3a5230',
  h: '#2d4226',
  T: '#6b5a40',
  R: '#c85a32',
  r: '#e07040',
  O: '#ff9858',
  A: '#8a5030',
  a: '#6b4028',
  K: '#5a4a38',
}

/** 树洞/石窟：中路从下方接入黑洞 */
export const MARKER_HOLE = buildSprite(
  [
    '......oooooooo......',
    '....ooWWWWWWWWoo....',
    '...oWWHHHHHHHHWWo...',
    '...oWWHNNNNNNHHWwo..',
    '..oWWHnnnnnnnnHHWo..',
    '..oWHnnnnnnnnnnHWo..',
    '..oWHnnnnnnnnnnHWo..',
    '..oWWHnnnnnnnnHHWo..',
    '...oWWHNNNNNNHHWwo..',
    '...oWWWWWWWWWWWWo...',
    '....ooWWWWWWWWoo....',
    '......oooooooo......',
  ],
  P,
  'marker-hole',
)

/** 营地栅栏门 + 暖色篝火（无黄色小人） */
export const MARKER_CAMP = buildSprite(
  [
    '........................',
    '......oooooooooo......',
    '.....oWWWWWWWWWWWo.....',
    '.....oWw.....wWo.....',
    '.....oW..oRRo.Wo.....',
    '.....oW.orRrO.Wo.....',
    '.....oW..oRRo.Wo.....',
    '.....oWWWWWWWWWWWo.....',
    '......oooooooooo......',
    '........................',
  ],
  P,
  'marker-camp',
)

export function getHoleMarker(): SpriteCanvas {
  return MARKER_HOLE
}

export function getCampMarker(): SpriteCanvas {
  return MARKER_CAMP
}
