import { LEVEL_ID } from '../config/level1'
import type { GameSettings, SaveData } from './types'

const STORAGE_KEY = 'fantasy-td-save-v1'

const defaultSave = (): SaveData => ({
  version: 1,
  settings: { muted: false, speed: 1 },
  levels: {
    [LEVEL_ID]: { cleared: false, bestWave: 0 },
  },
})

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as SaveData
    if (parsed.version !== 1) return defaultSave()
    return {
      ...defaultSave(),
      ...parsed,
      settings: { ...defaultSave().settings, ...parsed.settings },
      levels: { ...defaultSave().levels, ...parsed.levels },
    }
  } catch {
    return defaultSave()
  }
}

export function writeSave(data: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function updateSettings(patch: Partial<GameSettings>): SaveData {
  const save = loadSave()
  save.settings = { ...save.settings, ...patch }
  writeSave(save)
  return save
}

export function markLevelProgress(waveIndex: number, cleared: boolean): SaveData {
  const save = loadSave()
  const entry = save.levels[LEVEL_ID] ?? { cleared: false, bestWave: 0 }
  entry.bestWave = Math.max(entry.bestWave, waveIndex + 1)
  if (cleared) entry.cleared = true
  save.levels[LEVEL_ID] = entry
  writeSave(save)
  return save
}
