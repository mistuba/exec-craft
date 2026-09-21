export type EnemyKind = 'goblin' | 'orc' | 'wolf' | 'golem'

export interface EnemyDef {
  id: EnemyKind
  name: string
  maxHp: number
  speed: number
  reward: number
  radius: number
  color: string
  accent: string
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  goblin: {
    id: 'goblin',
    name: '哥布林',
    maxHp: 55,
    speed: 72,
    reward: 8,
    radius: 11,
    color: '#6ab04c',
    accent: '#2d5016',
  },
  orc: {
    id: 'orc',
    name: '兽人步兵',
    maxHp: 140,
    speed: 52,
    reward: 14,
    radius: 14,
    color: '#7f8c8d',
    accent: '#2c3e50',
  },
  wolf: {
    id: 'wolf',
    name: '暗影狼',
    maxHp: 85,
    speed: 96,
    reward: 12,
    radius: 12,
    color: '#5f4b8b',
    accent: '#2d1b4e',
  },
  golem: {
    id: 'golem',
    name: '石魔',
    maxHp: 520,
    speed: 38,
    reward: 55,
    radius: 18,
    color: '#95a5a6',
    accent: '#4a4a4a',
  },
}

export interface WaveSpec {
  label: string
  groups: { kind: EnemyKind; count: number; interval: number }[]
  delayAfter: number
}

export const LEVEL_WAVES: WaveSpec[] = [
  {
    label: '第 1 波',
    groups: [{ kind: 'goblin', count: 8, interval: 0.75 }],
    delayAfter: 4,
  },
  {
    label: '第 2 波',
    groups: [{ kind: 'goblin', count: 12, interval: 0.65 }],
    delayAfter: 4,
  },
  {
    label: '第 3 波',
    groups: [
      { kind: 'goblin', count: 6, interval: 0.6 },
      { kind: 'wolf', count: 4, interval: 0.85 },
    ],
    delayAfter: 5,
  },
  {
    label: '第 4 波',
    groups: [{ kind: 'orc', count: 8, interval: 1.0 }],
    delayAfter: 5,
  },
  {
    label: '第 5 波',
    groups: [
      { kind: 'goblin', count: 10, interval: 0.55 },
      { kind: 'orc', count: 4, interval: 1.1 },
    ],
    delayAfter: 5,
  },
  {
    label: '第 6 波',
    groups: [{ kind: 'wolf', count: 14, interval: 0.7 }],
    delayAfter: 5,
  },
  {
    label: '第 7 波',
    groups: [
      { kind: 'orc', count: 10, interval: 0.9 },
      { kind: 'wolf', count: 6, interval: 0.8 },
    ],
    delayAfter: 6,
  },
  {
    label: '第 8 波',
    groups: [{ kind: 'goblin', count: 20, interval: 0.45 }],
    delayAfter: 5,
  },
  {
    label: '第 9 波',
    groups: [{ kind: 'orc', count: 14, interval: 0.75 }],
    delayAfter: 6,
  },
  {
    label: '第 10 波',
    groups: [
      { kind: 'wolf', count: 10, interval: 0.65 },
      { kind: 'orc', count: 8, interval: 0.85 },
    ],
    delayAfter: 6,
  },
  {
    label: '第 11 波',
    groups: [{ kind: 'goblin', count: 15, interval: 0.4 }, { kind: 'golem', count: 1, interval: 2 }],
    delayAfter: 7,
  },
  {
    label: '第 12 波 · 终章',
    groups: [
      { kind: 'wolf', count: 12, interval: 0.55 },
      { kind: 'orc', count: 10, interval: 0.7 },
      { kind: 'golem', count: 2, interval: 2.5 },
    ],
    delayAfter: 8,
  },
]
