import './style.css'
import { LEVEL_WAVES } from './config/enemies'
import { LEVEL_NAME, MAP_H, MAP_W } from './config/level1'
import { TOWER_DEFS, type TowerKind } from './config/towers'
import * as audio from './game/audio'
import { GameEngine } from './game/engine'
import { fitPixelCanvas } from './game/canvasFit'
import { drawGame } from './game/render'
import { loadSave, updateSettings } from './game/save'
import { formatWaveEnemies, waveFraction } from './game/waveInfo'

const app = document.querySelector<HTMLDivElement>('#app')!
const save = loadSave()
audio.setMuted(save.settings.muted)

const engine = new GameEngine()
engine.speed = save.settings.speed

app.innerHTML = `
  <header>
    <div class="title-row">
      <div>
        <h1>奇幻塔防 · ${LEVEL_NAME}</h1>
        <p>简易像素奇幻风 · 固定路线放塔。漏怪 ${10} 个失败。放塔后自动退出建造；Shift 连续放置。</p>
      </div>
      <button type="button" class="icon-btn${save.settings.muted ? ' is-muted' : ''}" id="mute" aria-pressed="${save.settings.muted}" aria-label="${save.settings.muted ? '打开音效' : '关闭音效'}" title="音效">
        <svg class="icon-on" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/>
          <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M16.5 9.2a3.2 3.2 0 0 1 0 5.6"/>
          <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M18.8 7a6 6 0 0 1 0 10"/>
        </svg>
        <svg class="icon-off" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/>
          <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M16 10l4 4M20 10l-4 4"/>
        </svg>
      </button>
    </div>
  </header>
  <div class="layout">
    <div class="map-column">
    <div class="canvas-wrap" id="canvas-wrap">
      <canvas id="game" width="${MAP_W}" height="${MAP_H}" aria-label="游戏画布"></canvas>
      <div class="overlay hidden" id="overlay">
        <div class="card">
          <h3 id="overlay-title"></h3>
          <p id="overlay-msg"></p>
          <button type="button" class="primary" id="overlay-btn">确定</button>
        </div>
      </div>
    </div>
    </div>
    <aside class="side">
      <div class="panel hud">
        <div class="stats">
          <div class="stat"><span>金币</span><strong id="gold">0</strong></div>
          <div class="stat"><span>漏怪</span><strong id="leaks">0 / 10</strong></div>
          <div class="stat"><span>波次</span><strong id="wave">0/12</strong></div>
          <div class="stat"><span>场上敌人</span><strong id="enemy-count">0</strong></div>
        </div>
        <p class="wave-detail" id="wave-detail"></p>
        <div class="wave-actions">
          <button type="button" class="primary" id="start-wave">开始下一波</button>
          <button type="button" class="primary hidden" id="wave-speed">倍速：1×</button>
          <button type="button" class="secondary hidden" id="pause-game">暂停</button>
        </div>
        <p class="hint" id="wave-hint">选塔后点草地建造；右键或 Esc 取消建造。点击已有塔可升级或出售。</p>
        <div class="selection-block">
          <div class="inspector">
            <div class="selection-info" id="selection-info">未选中塔</div>
            <div class="actions hidden" id="tower-actions">
              <button type="button" class="secondary" id="upgrade" disabled>升级（2 级）</button>
              <button type="button" class="danger" id="sell" disabled>出售</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <div class="panel dock">
      <h2>建造</h2>
      <div class="tower-btns" id="tower-btns"></div>
    </div>
  </div>
`

const mapColumn = document.querySelector<HTMLDivElement>('.map-column')!
const canvasWrap = document.querySelector<HTMLDivElement>('#canvas-wrap')!
const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false
const refitCanvas = () => fitPixelCanvas(canvas, canvasWrap, MAP_W, MAP_H, mapColumn)
refitCanvas()
window.addEventListener('resize', refitCanvas)
const towerBtns = document.querySelector<HTMLDivElement>('#tower-btns')!

const kinds: TowerKind[] = ['bolt', 'frost', 'ember']
for (const kind of kinds) {
  const def = TOWER_DEFS[kind]
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'tower-btn'
  btn.dataset.kind = kind
  btn.innerHTML = `
    <div class="swatch" style="background:${def.color}">${def.icon}</div>
    <div class="meta">
      <div class="name">${def.name}</div>
      <div class="desc">${def.description}</div>
      <div class="cost">造价 ${def.cost} · 升级 ${def.upgradeCost}</div>
    </div>
  `
  btn.addEventListener('click', () => {
    audio.unlockAudio()
    const cur = engine.snapshot().buildKind
    if (cur === kind) {
      engine.setBuildKind(null)
    } else {
      engine.setBuildKind(kind)
    }
  })
  towerBtns.appendChild(btn)
}

const goldEl = document.querySelector<HTMLSpanElement>('#gold')!
const leaksEl = document.querySelector<HTMLSpanElement>('#leaks')!
const waveEl = document.querySelector<HTMLSpanElement>('#wave')!
const waveDetailEl = document.querySelector<HTMLParagraphElement>('#wave-detail')!
const towerActionsEl = document.querySelector<HTMLDivElement>('#tower-actions')!
const enemyCountEl = document.querySelector<HTMLSpanElement>('#enemy-count')!
const startWaveBtn = document.querySelector<HTMLButtonElement>('#start-wave')!
const pauseBtn = document.querySelector<HTMLButtonElement>('#pause-game')!
const waveSpeedBtn = document.querySelector<HTMLButtonElement>('#wave-speed')!
const upgradeBtn = document.querySelector<HTMLButtonElement>('#upgrade')!
const sellBtn = document.querySelector<HTMLButtonElement>('#sell')!
const selectionInfo = document.querySelector<HTMLDivElement>('#selection-info')!
const waveHint = document.querySelector<HTMLParagraphElement>('#wave-hint')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const overlayTitle = document.querySelector<HTMLHeadingElement>('#overlay-title')!
const overlayMsg = document.querySelector<HTMLParagraphElement>('#overlay-msg')!
const overlayBtn = document.querySelector<HTMLButtonElement>('#overlay-btn')!
let hoverCell: { col: number; row: number } | null = null
let lastSnap = engine.snapshot()

function cellFromEvent(clientX: number, clientY: number): { col: number; row: number } | null {
  const rect = canvas.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * MAP_W
  const y = ((clientY - rect.top) / rect.height) * MAP_H
  const col = Math.floor(x / 40)
  const row = Math.floor(y / 40)
  if (col < 0 || row < 0 || col >= 18 || row >= 12) return null
  return { col, row }
}

function refreshUI(snap = lastSnap): void {
  goldEl.textContent = String(snap.gold)
  leaksEl.textContent = `${snap.leaks} / 10`
  waveEl.textContent = waveFraction(snap.waveIndex, snap.phase)
  enemyCountEl.textContent = String(snap.enemiesRemaining)

  const waveActive = snap.phase === 'wave' && snap.enemiesRemaining > 0
  const nextWaveIdx =
    snap.waveIndex < 0
      ? 0
      : snap.phase === 'prep'
        ? Math.min(snap.waveIndex + 1, LEVEL_WAVES.length - 1)
        : snap.waveIndex

  if (snap.phase === 'won' || snap.phase === 'lost') {
    waveDetailEl.textContent = ''
  } else if (waveActive) {
    waveDetailEl.textContent = `本波敌人：${formatWaveEnemies(LEVEL_WAVES[snap.waveIndex])}`
  } else {
    const label = snap.waveIndex < 0 ? '首波预览' : '下波预览'
    waveDetailEl.textContent = `${label}：${formatWaveEnemies(LEVEL_WAVES[nextWaveIdx])}`
  }

  const combatUi = waveActive || snap.paused
  const ended = snap.phase === 'won' || snap.phase === 'lost'

  startWaveBtn.classList.toggle('hidden', combatUi && !ended)
  waveSpeedBtn.classList.toggle('hidden', !combatUi || ended)
  pauseBtn.classList.toggle('hidden', !combatUi || ended)

  startWaveBtn.disabled = ended || waveActive || snap.paused
  pauseBtn.disabled = ended
  pauseBtn.textContent = snap.paused ? '继续' : '暂停'

  waveSpeedBtn.textContent = loadSave().settings.speed === 2 ? '倍速：2×' : '倍速：1×'

  if (snap.phase === 'won') {
    startWaveBtn.classList.remove('hidden')
    startWaveBtn.textContent = '已通关'
    startWaveBtn.disabled = true
  } else if (snap.phase === 'lost') {
    startWaveBtn.classList.remove('hidden')
    startWaveBtn.textContent = '已失败'
    startWaveBtn.disabled = true
  } else if (!combatUi) {
    startWaveBtn.textContent = snap.waveIndex < 0 ? '开始第 1 波' : '开始下一波'
  }

  const sel = snap.towers.find((t) => t.id === snap.selectedTowerId)
  towerActionsEl.classList.toggle('hidden', !sel)
  if (sel) {
    const def = TOWER_DEFS[sel.kind]
    const stats = def.levels[sel.level - 1]
    const splash = stats.splashRadius ? ` · 灼烧半径 ${stats.splashRadius}` : ''
    selectionInfo.innerHTML = `已选 <strong>${def.name}</strong>（${sel.level} 级）<br>伤害 ${stats.damage} · 射程 ${stats.range}${splash}`
    upgradeBtn.disabled = sel.level >= 2 || snap.gold < def.upgradeCost
    upgradeBtn.textContent =
      sel.level >= 2 ? '已满级' : `升级（${def.upgradeCost} 金）`
    sellBtn.disabled = false
    const refund = Math.floor(sel.invested * def.sellRatio)
    sellBtn.textContent = `出售（${refund} 金）`
  } else if (snap.buildKind) {
    selectionInfo.innerHTML = `建造：<strong>${TOWER_DEFS[snap.buildKind].name}</strong><br>点草地放置；Esc / 右键取消（Shift 连续放）`
  } else {
    selectionInfo.textContent = '未选中塔（点空地可取消选中）'
  }

  document.querySelectorAll('.tower-btn').forEach((el) => {
    const k = (el as HTMLElement).dataset.kind as TowerKind
    el.classList.toggle('active', snap.buildKind === k)
  })

  if (snap.phase === 'won') {
    overlay.classList.remove('hidden')
    overlayTitle.textContent = '胜利！'
    overlayMsg.textContent = '你守住了幽林小径。进度已写入本机存档。'
    overlayBtn.textContent = '继续查看'
  } else if (snap.phase === 'lost') {
    overlay.classList.remove('hidden')
    overlayTitle.textContent = '失败'
    overlayMsg.textContent = '漏怪过多。可刷新页面重新开始（已通关记录仍会保留）。'
    overlayBtn.textContent = '知道了'
  } else {
    overlay.classList.add('hidden')
  }

  waveHint.textContent = snap.paused
    ? '游戏已暂停，点击「继续」恢复。'
    : snap.phase === 'prep' && snap.waveIndex >= 0
      ? '波次间隙可调整防线。准备好后点击「开始下一波」。'
      : '选塔后点草地建造；右键或 Esc 取消建造。点击已有塔可升级或出售。'
}

function syncFromEngine(): void {
  lastSnap = engine.snapshot()
  refreshUI(lastSnap)
}

canvas.addEventListener('pointermove', (e) => {
  hoverCell = cellFromEvent(e.clientX, e.clientY)
})

canvas.addEventListener('pointerleave', () => {
  hoverCell = null
})

canvas.addEventListener('contextmenu', (e) => e.preventDefault())

canvas.addEventListener('pointerdown', (e) => {
  audio.unlockAudio()
  if (e.button === 2) {
    engine.setBuildKind(null)
    return
  }
  const cell = cellFromEvent(e.clientX, e.clientY)
  if (!cell) return
  const occupied = lastSnap.towers.some((t) => t.col === cell.col && t.row === cell.row)
  if (occupied) {
    engine.selectTowerAt(cell.col, cell.row)
    syncFromEngine()
  } else if (lastSnap.buildKind) {
    const kind = lastSnap.buildKind
    const shift = e.shiftKey
    engine.tryBuild(cell.col, cell.row)
    if (shift) engine.setBuildKind(kind)
    syncFromEngine()
  } else {
    engine.clearSelection()
    syncFromEngine()
  }
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    engine.setBuildKind(null)
    syncFromEngine()
  }
})

startWaveBtn.addEventListener('click', () => {
  audio.unlockAudio()
  engine.startNextWave()
})

pauseBtn.addEventListener('click', () => {
  engine.togglePause()
})

upgradeBtn.addEventListener('click', () => engine.tryUpgrade())
sellBtn.addEventListener('click', () => engine.trySell())

const muteBtn = document.querySelector<HTMLButtonElement>('#mute')!
muteBtn.addEventListener('click', () => {
  const next = !loadSave().settings.muted
  updateSettings({ muted: next })
  audio.setMuted(next)
  muteBtn.classList.toggle('is-muted', next)
  muteBtn.setAttribute('aria-pressed', String(next))
  muteBtn.setAttribute('aria-label', next ? '打开音效' : '关闭音效')
})

function toggleGameSpeed(): void {
  const cur = loadSave().settings
  const next = cur.speed === 2 ? 1 : 2
  updateSettings({ speed: next })
  engine.speed = next
  waveSpeedBtn.textContent = next === 2 ? '倍速：2×' : '倍速：1×'
}

waveSpeedBtn.addEventListener('click', toggleGameSpeed)

overlayBtn.addEventListener('click', () => overlay.classList.add('hidden'))

let prev = performance.now()
function frame(now: number): void {
  const dt = Math.min(0.05, (now - prev) / 1000)
  prev = now
  engine.update(dt)
  lastSnap = engine.snapshot()
  refreshUI(lastSnap)
  drawGame(ctx, lastSnap, hoverCell)
  requestAnimationFrame(frame)
}
syncFromEngine()
requestAnimationFrame(frame)
