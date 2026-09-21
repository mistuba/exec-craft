import './style.css'
import { LEVEL_WAVES } from './config/enemies'
import { LEVEL_NAME, MAP_H, MAP_W } from './config/level1'
import { TOWER_DEFS, type TowerKind } from './config/towers'
import * as audio from './game/audio'
import { GameEngine } from './game/engine'
import { drawGame } from './game/render'
import { loadSave, updateSettings } from './game/save'

const app = document.querySelector<HTMLDivElement>('#app')!
const save = loadSave()
audio.setMuted(save.settings.muted)

const engine = new GameEngine()
engine.speed = save.settings.speed

app.innerHTML = `
  <header>
    <h1>奇幻塔防 · ${LEVEL_NAME}</h1>
    <p>固定路线、草地放塔。漏怪 ${10} 个失败。放塔后自动退出建造模式；按住 Shift 可连续放置。</p>
  </header>
  <div class="layout">
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
    <aside class="side">
      <div class="panel stats-panel">
        <div class="stats">
          <div class="stat"><span>金币</span><strong id="gold">0</strong></div>
          <div class="stat"><span>漏怪</span><strong id="leaks">0 / 10</strong></div>
          <div class="stat"><span>波次</span><strong id="wave">准备</strong></div>
          <div class="stat"><span>场上敌人</span><strong id="enemy-count">0</strong></div>
        </div>
        <button type="button" class="primary" id="start-wave">开始下一波</button>
        <p class="hint" id="wave-hint">选塔后点草地建造；右键或 Esc 取消建造。点击已有塔可升级或出售。</p>
      </div>
      <div class="panel toolbar">
        <h2>建造</h2>
        <div class="tower-btns" id="tower-btns"></div>
        <button type="button" class="secondary cancel-build hidden" id="cancel-build">取消建造（Esc）</button>
        <div class="selection-info" id="selection-info">未选中塔</div>
        <div class="actions">
          <button type="button" class="secondary" id="upgrade" disabled>升级（2 级）</button>
          <button type="button" class="danger" id="sell" disabled>出售</button>
        </div>
      </div>
      <div class="panel">
        <h2>设置</h2>
        <div class="settings">
          <button type="button" class="secondary" id="mute">${save.settings.muted ? '音效：关' : '音效：开'}</button>
          <button type="button" class="secondary" id="speed">${save.settings.speed === 2 ? '倍速：2×' : '倍速：1×'}</button>
        </div>
      </div>
    </aside>
  </div>
`

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const ctx = canvas.getContext('2d')!
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
const enemyCountEl = document.querySelector<HTMLSpanElement>('#enemy-count')!
const startWaveBtn = document.querySelector<HTMLButtonElement>('#start-wave')!
const upgradeBtn = document.querySelector<HTMLButtonElement>('#upgrade')!
const sellBtn = document.querySelector<HTMLButtonElement>('#sell')!
const selectionInfo = document.querySelector<HTMLDivElement>('#selection-info')!
const waveHint = document.querySelector<HTMLParagraphElement>('#wave-hint')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const overlayTitle = document.querySelector<HTMLHeadingElement>('#overlay-title')!
const overlayMsg = document.querySelector<HTMLParagraphElement>('#overlay-msg')!
const overlayBtn = document.querySelector<HTMLButtonElement>('#overlay-btn')!
const cancelBuildBtn = document.querySelector<HTMLButtonElement>('#cancel-build')!

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
  waveEl.textContent =
    snap.waveIndex < 0 ? '准备' : `${snap.waveLabel}（${snap.waveIndex + 1}/${LEVEL_WAVES.length}）`
  enemyCountEl.textContent = String(snap.enemiesRemaining)

  const waveActive = snap.phase === 'wave' && snap.enemiesRemaining > 0
  startWaveBtn.disabled = snap.phase === 'won' || snap.phase === 'lost' || waveActive

  if (snap.phase === 'won') {
    startWaveBtn.textContent = '已通关'
    startWaveBtn.disabled = true
  } else if (snap.phase === 'lost') {
    startWaveBtn.textContent = '已失败'
    startWaveBtn.disabled = true
  } else if (waveActive) {
    startWaveBtn.textContent = '波次进行中…'
  } else if (snap.waveIndex >= LEVEL_WAVES.length - 1) {
    startWaveBtn.textContent = '最后一波'
  } else {
    startWaveBtn.textContent = snap.waveIndex < 0 ? '开始第 1 波' : '开始下一波'
  }

  const sel = snap.towers.find((t) => t.id === snap.selectedTowerId)
  if (sel) {
    const def = TOWER_DEFS[sel.kind]
    const stats = def.levels[sel.level - 1]
    selectionInfo.innerHTML = `已选 <strong>${def.name}</strong>（${sel.level} 级）<br>伤害 ${stats.damage} · 射程 ${stats.range}`
    upgradeBtn.disabled = sel.level >= 2 || snap.gold < def.upgradeCost
    upgradeBtn.textContent =
      sel.level >= 2 ? '已满级' : `升级（${def.upgradeCost} 金）`
    sellBtn.disabled = false
    sellBtn.textContent = `出售（约 ${Math.floor(sel.invested * def.sellRatio)} 金）`
  } else {
    if (snap.buildKind) {
      selectionInfo.innerHTML = `建造：<strong>${TOWER_DEFS[snap.buildKind].name}</strong><br>点草地放置；放一次后自动退出（Shift 连续放）`
      cancelBuildBtn.classList.remove('hidden')
    } else {
      selectionInfo.textContent = '未选中塔（点空地可取消选中）'
      cancelBuildBtn.classList.add('hidden')
    }
    upgradeBtn.disabled = true
    upgradeBtn.textContent = '升级（2 级）'
    sellBtn.disabled = true
    sellBtn.textContent = '出售'
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

  waveHint.textContent =
    snap.phase === 'prep' && snap.waveIndex >= 0
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

cancelBuildBtn.addEventListener('click', () => {
  engine.setBuildKind(null)
  syncFromEngine()
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

upgradeBtn.addEventListener('click', () => engine.tryUpgrade())
sellBtn.addEventListener('click', () => engine.trySell())

const muteBtn = document.querySelector<HTMLButtonElement>('#mute')!
muteBtn.addEventListener('click', () => {
  const next = !loadSave().settings.muted
  updateSettings({ muted: next })
  audio.setMuted(next)
  muteBtn.textContent = next ? '音效：关' : '音效：开'
})

const speedBtn = document.querySelector<HTMLButtonElement>('#speed')!
speedBtn.addEventListener('click', () => {
  const cur = loadSave().settings
  const next = cur.speed === 2 ? 1 : 2
  updateSettings({ speed: next })
  engine.speed = next
  speedBtn.textContent = next === 2 ? '倍速：2×' : '倍速：1×'
})

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
