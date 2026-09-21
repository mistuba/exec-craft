import type { EnemyKind } from '../config/enemies'
import type { TowerKind } from '../config/towers'

export interface Enemy {
  id: number
  kind: EnemyKind
  hp: number
  maxHp: number
  speed: number
  pathIndex: number
  pathProgress: number
  pathDist: number
  x: number
  y: number
  slowUntil: number
  slowFactor: number
}

export interface Tower {
  id: number
  kind: TowerKind
  level: 1 | 2
  col: number
  row: number
  x: number
  y: number
  invested: number
  cooldown: number
}

export interface Projectile {
  id: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number
  speed: number
  damage: number
  towerKind: TowerKind
  splashRadius?: number
  slowFactor?: number
  slowDuration?: number
  targetId: number
  /** 追踪目标位置（每帧更新 toX/toY） */
  homing: boolean
}

export interface Corpse {
  id: number
  kind: EnemyKind
  x: number
  y: number
  life: number
  maxLife: number
}

export interface HitEffect {
  id: number
  x: number
  y: number
  life: number
  maxLife: number
  towerKind: TowerKind
  radius: number
}

export interface FloatingText {
  id: number
  x: number
  y: number
  text: string
  color: string
  life: number
}

export type GamePhase = 'prep' | 'wave' | 'won' | 'lost'

export interface GameSettings {
  muted: boolean
  speed: 1 | 2
}

export interface SaveData {
  version: 1
  settings: GameSettings
  levels: Record<
    string,
    {
      cleared: boolean
      bestWave: number
    }
  >
}
