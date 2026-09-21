import { ENEMY_DEFS, LEVEL_WAVES, type EnemyKind } from '../config/enemies'
import {
  BUILD_GRID,
  CELL,
  MAX_LEAKS,
  PATH_WAYPOINTS,
  START_GOLD,
} from '../config/level1'
import { TOWER_DEFS, type TowerKind } from '../config/towers'
import * as audio from './audio'
import { distanceAlongPath, pathLength, positionAtDistance } from './path'
import { markLevelProgress } from './save'
import type {
  Enemy,
  FloatingText,
  GamePhase,
  Projectile,
  Tower,
} from './types'

let nextId = 1

export interface GameSnapshot {
  gold: number
  leaks: number
  waveIndex: number
  phase: GamePhase
  towers: Tower[]
  enemies: Enemy[]
  projectiles: Projectile[]
  floats: FloatingText[]
  waveLabel: string
  enemiesRemaining: number
  selectedTowerId: number | null
  buildKind: TowerKind | null
  time: number
}

type Listener = (snap: GameSnapshot) => void

export class GameEngine {
  gold = START_GOLD
  leaks = 0
  waveIndex = -1
  phase: GamePhase = 'prep'
  towers: Tower[] = []
  enemies: Enemy[] = []
  projectiles: Projectile[] = []
  floats: FloatingText[] = []
  selectedTowerId: number | null = null
  buildKind: TowerKind | null = null
  time = 0
  speed = 1

  private spawnQueue: { kind: EnemyKind; at: number }[] = []
  private waveDoneAt = 0
  private listeners: Listener[] = []
  private totalPath = pathLength()

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn)
    fn(this.snapshot())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn)
    }
  }

  private emit(): void {
    const s = this.snapshot()
    this.listeners.forEach((l) => l(s))
  }

  snapshot(): GameSnapshot {
    return {
      gold: this.gold,
      leaks: this.leaks,
      waveIndex: this.waveIndex,
      phase: this.phase,
      towers: this.towers,
      enemies: this.enemies,
      projectiles: this.projectiles,
      floats: this.floats,
      waveLabel:
        this.waveIndex >= 0 ? LEVEL_WAVES[this.waveIndex]?.label ?? '' : '准备阶段',
      enemiesRemaining: this.spawnQueue.length + this.enemies.length,
      selectedTowerId: this.selectedTowerId,
      buildKind: this.buildKind,
      time: this.time,
    }
  }

  setBuildKind(kind: TowerKind | null): void {
    this.buildKind = kind
    this.selectedTowerId = null
    this.emit()
  }

  selectTowerAt(col: number, row: number): void {
    const t = this.towers.find((tw) => tw.col === col && tw.row === row)
    this.selectedTowerId = t?.id ?? null
    if (t) this.buildKind = null
    this.emit()
  }

  clearSelection(): void {
    this.selectedTowerId = null
    this.emit()
  }

  canBuild(col: number, row: number): boolean {
    if (BUILD_GRID[row]?.[col] !== 0) return false
    return !this.towers.some((t) => t.col === col && t.row === row)
  }

  tryBuild(col: number, row: number): boolean {
    if (!this.buildKind || this.phase === 'won' || this.phase === 'lost') return false
    if (!this.canBuild(col, row)) return false
    const def = TOWER_DEFS[this.buildKind]
    if (this.gold < def.cost) return false
    this.gold -= def.cost
    const tower: Tower = {
      id: nextId++,
      kind: this.buildKind,
      level: 1,
      col,
      row,
      x: col * CELL + CELL / 2,
      y: row * CELL + CELL / 2,
      invested: def.cost,
      cooldown: 0,
    }
    this.towers.push(tower)
    this.selectedTowerId = tower.id
    audio.playBuild()
    this.addFloat(tower.x, tower.y, `-${def.cost}`, '#f1c40f')
    this.emit()
    return true
  }

  tryUpgrade(): boolean {
    const t = this.towers.find((tw) => tw.id === this.selectedTowerId)
    if (!t || t.level >= 2) return false
    const def = TOWER_DEFS[t.kind]
    if (this.gold < def.upgradeCost) return false
    this.gold -= def.upgradeCost
    t.level = 2
    t.invested += def.upgradeCost
    audio.playUpgrade()
    this.addFloat(t.x, t.y, `升级 -${def.upgradeCost}`, '#a29bfe')
    this.emit()
    return true
  }

  trySell(): boolean {
    const idx = this.towers.findIndex((tw) => tw.id === this.selectedTowerId)
    if (idx < 0) return false
    const t = this.towers[idx]
    const def = TOWER_DEFS[t.kind]
    const refund = Math.floor(t.invested * def.sellRatio)
    this.gold += refund
    this.towers.splice(idx, 1)
    this.selectedTowerId = null
    audio.playSell()
    this.addFloat(t.x, t.y, `+${refund}`, '#2ecc71')
    this.emit()
    return true
  }

  startNextWave(): void {
    if (this.phase === 'won' || this.phase === 'lost') return
    if (this.waveIndex >= LEVEL_WAVES.length - 1 && this.phase === 'wave') return
    const next = this.waveIndex + 1
    if (next >= LEVEL_WAVES.length) return
    if (this.phase === 'wave' && this.enemies.length + this.spawnQueue.length > 0) return

    this.waveIndex = next
    this.phase = 'wave'
    const wave = LEVEL_WAVES[next]
    let spawnAt = this.time + 0.5
    for (const group of wave.groups) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({ kind: group.kind, at: spawnAt })
        spawnAt += group.interval
      }
    }
    this.waveDoneAt = spawnAt + wave.delayAfter
    audio.playWaveStart()
    markLevelProgress(next, false)
    this.emit()
  }

  update(dt: number): void {
    if (this.phase === 'won' || this.phase === 'lost') return
    const scaled = dt * this.speed
    this.time += scaled

    while (this.spawnQueue.length > 0 && this.spawnQueue[0].at <= this.time) {
      const item = this.spawnQueue.shift()!
      this.spawnEnemy(item.kind)
    }

    for (const e of this.enemies) {
      const def = ENEMY_DEFS[e.kind]
      const slow = e.slowUntil > this.time ? e.slowFactor : 1
      const move = def.speed * slow * scaled
      let dist = distanceAlongPath(e.pathIndex, e.pathProgress) + move
      if (dist >= this.totalPath) {
        e.hp = 0
        continue
      }
      const pos = positionAtDistance(dist)
      e.pathIndex = pos.segIndex
      e.pathProgress = pos.t
      e.x = pos.x
      e.y = pos.y
    }

    this.enemies = this.enemies.filter((e) => {
      if (e.hp <= 0) {
        if (distanceAlongPath(e.pathIndex, e.pathProgress) >= this.totalPath - 0.5) {
          this.leaks++
          audio.playLeak()
          if (this.leaks >= MAX_LEAKS) this.endLost()
        } else {
          const def = ENEMY_DEFS[e.kind]
          this.gold += def.reward
          audio.playGold()
        }
        return false
      }
      return true
    })

    for (const t of this.towers) {
      if (t.cooldown > 0) t.cooldown -= scaled
      const stats = TOWER_DEFS[t.kind].levels[t.level - 1]
      if (t.cooldown > 0) continue
      const target = this.findTarget(t, stats.range)
      if (!target) continue
      t.cooldown = stats.fireInterval
      this.projectiles.push({
        id: nextId++,
        fromX: t.x,
        fromY: t.y,
        toX: target.x,
        toY: target.y,
        progress: 0,
        speed: 420,
        damage: stats.damage,
        towerKind: t.kind,
        splashRadius: stats.splashRadius,
        slowFactor: stats.slowFactor,
        slowDuration: stats.slowDuration,
        targetId: target.id,
      })
      audio.playShoot(t.kind)
    }

    for (const p of this.projectiles) {
      const dist = Math.hypot(p.toX - p.fromX, p.toY - p.fromY)
      p.progress += (p.speed * scaled) / Math.max(dist, 1)
      if (p.progress >= 1) {
        this.resolveProjectile(p)
        p.progress = 2
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.progress < 1)

    for (const f of this.floats) f.life -= scaled
    this.floats = this.floats.filter((f) => f.life > 0)

    if (
      this.phase === 'wave' &&
      this.waveIndex >= 0 &&
      this.spawnQueue.length === 0 &&
      this.enemies.length === 0 &&
      this.time >= this.waveDoneAt
    ) {
      if (this.waveIndex >= LEVEL_WAVES.length - 1) {
        this.endWon()
      } else {
        this.phase = 'prep'
        this.emit()
      }
    }
  }

  private spawnEnemy(kind: EnemyKind): void {
    const def = ENEMY_DEFS[kind]
    const start = PATH_WAYPOINTS[0]
    this.enemies.push({
      id: nextId++,
      kind,
      hp: def.maxHp,
      maxHp: def.maxHp,
      speed: def.speed,
      pathIndex: 0,
      pathProgress: 0,
      x: start.x,
      y: start.y,
      slowUntil: 0,
      slowFactor: 1,
    })
  }

  private findTarget(tower: Tower, range: number): Enemy | null {
    let best: Enemy | null = null
    let bestDist = -1
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - tower.x, e.y - tower.y)
      if (d > range) continue
      const along = distanceAlongPath(e.pathIndex, e.pathProgress)
      if (along > bestDist) {
        bestDist = along
        best = e
      }
    }
    return best
  }

  private resolveProjectile(p: Projectile): void {
    const primary = this.enemies.find((e) => e.id === p.targetId)
    const hitX = primary?.x ?? p.toX
    const hitY = primary?.y ?? p.toY

    const applyHit = (e: Enemy, damage: number) => {
      e.hp -= damage
      if (p.slowFactor && p.slowDuration) {
        e.slowFactor = p.slowFactor
        e.slowUntil = this.time + p.slowDuration
      }
    }

    if (p.splashRadius) {
      for (const e of this.enemies) {
        if (Math.hypot(e.x - hitX, e.y - hitY) <= p.splashRadius) {
          applyHit(e, p.damage)
        }
      }
    } else if (primary) {
      applyHit(primary, p.damage)
    }
    audio.playHit()
  }

  private addFloat(x: number, y: number, text: string, color: string): void {
    this.floats.push({ id: nextId++, x, y, text, color, life: 1.2 })
  }

  private endWon(): void {
    this.phase = 'won'
    markLevelProgress(this.waveIndex, true)
    audio.playWin()
    this.emit()
  }

  private endLost(): void {
    this.phase = 'lost'
    audio.playLose()
    this.emit()
  }
}
