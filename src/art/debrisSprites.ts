import { buildSprite, type SpriteCanvas } from './pixelArt'

const P = {
  o: '#1a1423',
  G: '#4fa84c',
  g: '#489848',
  H: '#5a9a48',
  h: '#3d7a38',
  K: '#6b6358',
  k: '#4a443c',
  C: '#8a8074',
  c: '#6e665c',
  W: '#5c4a32',
  w: '#7a6248',
  T: '#8b6914',
  t: '#a67c3a',
  R: '#7a6a5a',
  r: '#9a8a78',
}

export const DEBRIS_ROCK = buildSprite(
  [
    '..oooo..',
    '.oKKKko.',
    'oKCCCCko',
    'oKCCCCko',
    'oKKKKKko',
    '.okkkko.',
  ],
  P,
  'debris-rock',
)

export const DEBRIS_PEBBLES = buildSprite(
  [
    '........',
    '..okk...',
    '.okkkko.',
    '.okk.ko.',
    '..okk...',
    '........',
  ],
  P,
  'debris-pebbles',
)

export const DEBRIS_FERN = buildSprite(
  [
    '...o....',
    '..oHo...',
    '.oHhHo..',
    'oHhhHho.',
    '.ohhho..',
    '..oho...',
  ],
  P,
  'debris-fern',
)

export const DEBRIS_LOG = buildSprite(
  [
    '........',
    '..oooooo',
    '.oWWWWWo',
    '.oWttWWo',
    '.oWWWWWo',
    '..oooooo',
  ],
  P,
  'debris-log',
)

export const DEBRIS_BUSH = buildSprite(
  [
    '...oooo...',
    '..oHHHho..',
    '.oHhhhHho.',
    'oHhhhhHho',
    '.oHhhhHho.',
    '..ohhhho..',
    '...ooo...',
  ],
  P,
  'debris-bush',
)

export const DEBRIS_STUMP = buildSprite(
  [
    '...oooo...',
    '..oWWWWo..',
    '.oWttttWo.',
    '.oWttttWo.',
    '..oWWWWo..',
    '...oooo...',
  ],
  P,
  'debris-stump',
)

export type DebrisKind = 'rock' | 'pebbles' | 'fern' | 'log' | 'bush' | 'stump'

const map: Record<DebrisKind, SpriteCanvas> = {
  rock: DEBRIS_ROCK,
  pebbles: DEBRIS_PEBBLES,
  fern: DEBRIS_FERN,
  log: DEBRIS_LOG,
  bush: DEBRIS_BUSH,
  stump: DEBRIS_STUMP,
}

export function getDebrisSprite(kind: DebrisKind): SpriteCanvas {
  return map[kind]
}
