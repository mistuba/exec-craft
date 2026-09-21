import type { EnemyKind } from '../config/enemies'
import type { TowerKind } from '../config/towers'
import { buildSprite, type SpriteCanvas } from './pixelArt'

const P = {
  o: '#1a1423',
  O: '#2d2540',
  G: '#4fa84c',
  g: '#489848',
  L: '#58b055',
  T: '#8b6914',
  t: '#c4a35a',
  s: '#6e5a3a',
  W: '#6b4c2a',
  w: '#9a7048',
  B: '#5dade2',
  b: '#85d8ff',
  F: '#dff9ff',
  R: '#e74c3c',
  r: '#ff6b4a',
  Y: '#f1c40f',
  y: '#d4a012',
  K: '#7f8c8d',
  k: '#566573',
  U: '#5f4b8b',
  u: '#8e7cc3',
  C: '#95a5a6',
  c: '#bdc3c7',
  H: '#6ab04c',
  h: '#4a8f38',
  D: '#2c3e50',
  d: '#1e2a36',
  A: '#e8b86d',
  a: '#c9924e',
  n: '#0d1117',
}

const towerSprites: Record<TowerKind, SpriteCanvas> = {
  bolt: buildSprite(
    [
      '......oooo......',
      '.....oAAAAo.....',
      '....oAAAAAAo....',
      '...oAAAYYAAo...',
      '...oAAAYYAAo...',
      '....oAAAAo....',
      '.....oWWWo.....',
      '....oWWWWWo....',
      '...oWWWWWWWo...',
      '...oWWo..oWWo...',
      '...oWWo..oWWo...',
      '...oWWo..oWWo...',
      '..oWWWWWWWWWo..',
      '..oWWWWWWWWWo..',
      '...ooooooooo...',
      '................',
    ],
    P,
    'tower-bolt',
  ),
  frost: buildSprite(
    [
      '......oooo......',
      '.....obbbbo.....',
      '....obBBBBBo....',
      '...obBFFFBbo...',
      '...obBFffBbo...',
      '....obBBBBo....',
      '.....oBBBo.....',
      '....oWWWWWo....',
      '...oWWWWWWWo...',
      '...oWWo..oWWo...',
      '...oWWo..oWWo...',
      '...oWWWWWWWo...',
      '..oWWWWWWWWWo..',
      '..oWWWWWWWWWo..',
      '...ooooooooo...',
      '................',
    ],
    P,
    'tower-frost',
  ),
  ember: buildSprite(
    [
      '......oooo......',
      '.....orRRo.....',
      '....orRRRRo....',
      '...orRYYYRo...',
      '...orRYYYRo...',
      '....orRRRo....',
      '.....oRRo.....',
      '....oWWWWWo....',
      '...oWWWWWWWo...',
      '...oWWo..oWWo...',
      '...oWWo..oWWo...',
      '...oWWWWWWWo...',
      '..oWWWWWWWWWo..',
      '..oWWWWWWWWWo..',
      '...ooooooooo...',
      '................',
    ],
    P,
    'tower-ember',
  ),
}

const enemySprites: Record<EnemyKind, SpriteCanvas> = {
  goblin: buildSprite(
    [
      '..oooo..',
      '.oHHHho.',
      '.oHoHho.',
      '.oHHHho.',
      '..oKKo..',
      '.oKKKKo.',
      '.oK..Ko.',
      '..o..o..',
    ],
    P,
    'enemy-goblin',
  ),
  orc: buildSprite(
    [
      '...oo...',
      '..oKKKo.',
      '.oKKKKKo',
      '.oKDKKKo',
      '.oKKKKKo',
      '..oKKKo.',
      '.oKooKo.',
      '.oK..Ko.',
    ],
    P,
    'enemy-orc',
  ),
  wolf: buildSprite(
    [
      '..oooo..',
      '.oUUUUo.',
      '.oUoUoUo',
      '.oUUUUo.',
      '..oUUo..',
      '.oUooUo.',
      '.oU..Uo.',
      '..o..o..',
    ],
    P,
    'enemy-wolf',
  ),
  golem: buildSprite(
    [
      '..oooooo..',
      '.oCCCCCCo.',
      '.oCKKKKCo.',
      '.oCKKKKCo.',
      '.oCCCCCCo.',
      '.oCKKKKCo.',
      '.oCKKKKCo.',
      '.oCCCCCCo.',
      '..oooooo..',
    ],
    P,
    'enemy-golem',
  ),
}

export function getTowerSprite(kind: TowerKind): SpriteCanvas {
  return towerSprites[kind]
}

export function getEnemySprite(kind: EnemyKind): SpriteCanvas {
  return enemySprites[kind]
}

export function getEnemyScale(kind: EnemyKind): number {
  if (kind === 'golem') return 3.2
  if (kind === 'orc') return 2.8
  return 2.5
}

export function getTowerScale(level: 1 | 2): number {
  return level === 2 ? 2.65 : 2.35
}
