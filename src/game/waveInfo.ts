import { ENEMY_DEFS, LEVEL_WAVES, type WaveSpec } from '../config/enemies'

export function waveTotalEnemies(wave: WaveSpec): number {
  return wave.groups.reduce((sum, g) => sum + g.count, 0)
}

export function formatWaveEnemies(wave: WaveSpec): string {
  const parts = wave.groups.map((g) => `${ENEMY_DEFS[g.kind].name}×${g.count}`)
  const total = waveTotalEnemies(wave)
  return `${parts.join('、')}（共 ${total} 只）`
}

/** 当前侧栏应展示的波次索引（含「即将开打」的下一波） */
export function displayWaveIndex(waveIndex: number, phase: string): number {
  if (waveIndex < 0) return 0
  if (phase === 'prep') return Math.min(waveIndex + 1, LEVEL_WAVES.length - 1)
  return waveIndex
}

/** 侧栏波次数字，仅 N/总数 */
export function waveFraction(waveIndex: number, phase: string): string {
  const total = LEVEL_WAVES.length
  if (waveIndex < 0) return `0/${total}`
  if (phase === 'wave') return `${waveIndex + 1}/${total}`
  return `${waveIndex + 1}/${total}`
}
