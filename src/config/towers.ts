export type TowerKind = 'bolt' | 'frost' | 'ember'

export interface TowerLevelStats {
  damage: number
  range: number
  fireInterval: number
  slowFactor?: number
  slowDuration?: number
  splashRadius?: number
}

export interface TowerDef {
  id: TowerKind
  name: string
  description: string
  cost: number
  upgradeCost: number
  sellRatio: number
  color: string
  accent: string
  icon: string
  levels: [TowerLevelStats, TowerLevelStats]
}

export const TOWER_DEFS: Record<TowerKind, TowerDef> = {
  bolt: {
    id: 'bolt',
    name: '强弩塔',
    description: '高伤害单体，适合点杀精英。',
    cost: 100,
    upgradeCost: 85,
    sellRatio: 0.7,
    color: '#c9a227',
    accent: '#5c4a12',
    icon: '弩',
    levels: [
      { damage: 28, range: 118, fireInterval: 0.95 },
      { damage: 52, range: 132, fireInterval: 0.82 },
    ],
  },
  frost: {
    id: 'frost',
    name: '寒霜祭坛',
    description: '伤害较低，显著减速敌人。',
    cost: 120,
    upgradeCost: 95,
    sellRatio: 0.7,
    color: '#6ec8e8',
    accent: '#1a4a5c',
    icon: '霜',
    levels: [
      {
        damage: 6,
        range: 102,
        fireInterval: 1.05,
        slowFactor: 0.42,
        slowDuration: 2.2,
      },
      {
        damage: 10,
        range: 114,
        fireInterval: 0.95,
        slowFactor: 0.58,
        slowDuration: 2.8,
      },
    ],
  },
  ember: {
    id: 'ember',
    name: '奥术余烬',
    description: '范围灼烧，单体伤害低于强弩。',
    cost: 150,
    upgradeCost: 110,
    sellRatio: 0.7,
    color: '#e87840',
    accent: '#6b2a12',
    icon: '焰',
    levels: [
      { damage: 14, range: 108, fireInterval: 1.15, splashRadius: 58 },
      { damage: 22, range: 118, fireInterval: 1.0, splashRadius: 68 },
    ],
  },
}
