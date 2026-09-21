import { buildSprite, type SpriteCanvas } from './pixelArt'
import type { DebrisKind } from '../config/mapDecorations'

const P = {
  o: '#1a1423',
  H: '#5a9a48',
  h: '#489040',
  G: '#4a9848',
  K: '#6b6358',
  C: '#8a8074',
  c: '#6e665c',
}

export const DEBRIS_BUSH = buildSprite(
  [
    '...oooo...',
    '..oHHHho..',
    '.oHhhhHho.',
    'oHhhhhHho',
    '.oHhhhHho.',
    '..ohhhho..',
  ],
  P,
  'debris-bush-v2',
)

export const DEBRIS_ROCK = buildSprite(
  [
    '..oooo..',
    '.oKKKko.',
    'oKCCCCko',
    'oKCCCCko',
    '.okkkko.',
  ],
  P,
  'debris-rock-v2',
)

export function getDebrisSprite(kind: DebrisKind): SpriteCanvas {
  return kind === 'bush' ? DEBRIS_BUSH : DEBRIS_ROCK
}
