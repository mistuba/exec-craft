import { buildSprite, type SpriteCanvas } from './pixelArt'

const P = {
  o: '#1a1423',
  K: '#5a5248',
  k: '#4a443c',
  C: '#8a8074',
  c: '#6e665c',
  W: '#6b5a48',
  w: '#8a7658',
  T: '#9a8668',
  t: '#b49a72',
  s: '#3d3528',
}

export const ROAD_PAD_A = buildSprite(
  [
    '....oooo....',
    '...oWWWWo...',
    '..oWttttWo..',
    '..oWt..tWo..',
    '..oWt..tWo..',
    '..oWttttWo..',
    '...oWWWWo...',
    '....oooo....',
  ],
  P,
  'road-pad-a',
)

export const ROAD_PAD_B = buildSprite(
  [
    '....oooo....',
    '...oWWWWo...',
    '..oWtttWWo..',
    '..oW.tt.Wo..',
    '..oWWtttWo..',
    '..oWttttWo..',
    '...oWWWWo...',
    '....oooo....',
  ],
  P,
  'road-pad-b',
)

export const ROAD_PAD_C = buildSprite(
  [
    '....oooo....',
    '...oWWWWo...',
    '..oWWttWWo..',
    '..oWt..tWo..',
    '..oWWttWWo..',
    '..oWttttWo..',
    '...oWWWWo...',
    '....oooo....',
  ],
  P,
  'road-pad-c',
)

const pads = [ROAD_PAD_A, ROAD_PAD_B, ROAD_PAD_C]

export function roadPadVariant(row: number, col: number): SpriteCanvas {
  return pads[(row * 17 + col * 31) % pads.length]
}
