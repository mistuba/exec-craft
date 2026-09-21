let ctx: AudioContext | null = null
let muted = false

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function setMuted(value: boolean): void {
  muted = value
}

export function unlockAudio(): void {
  const c = getCtx()
  if (c.state === 'suspended') c.resume()
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.04,
): void {
  if (muted) return
  const c = getCtx()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(c.destination)
  const t = c.currentTime
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.start(t)
  osc.stop(t + duration)
}

export function playBuild(): void {
  tone(520, 0.08, 'triangle', 0.05)
  tone(780, 0.1, 'triangle', 0.04)
}

export function playShoot(kind: 'bolt' | 'frost' | 'ember'): void {
  if (kind === 'bolt') tone(640, 0.05, 'square', 0.03)
  else if (kind === 'frost') tone(420, 0.12, 'sine', 0.035)
  else tone(280, 0.09, 'sawtooth', 0.028)
}

export function playHit(): void {
  tone(180, 0.06, 'triangle', 0.025)
}

export function playLeak(): void {
  tone(120, 0.2, 'sawtooth', 0.05)
}

export function playGold(): void {
  tone(880, 0.06, 'sine', 0.03)
  tone(1100, 0.08, 'sine', 0.025)
}

export function playWaveStart(): void {
  tone(330, 0.1, 'triangle', 0.04)
  tone(440, 0.15, 'triangle', 0.04)
}

export function playWin(): void {
  ;[523, 659, 784].forEach((f, i) => {
    setTimeout(() => tone(f, 0.2, 'triangle', 0.045), i * 120)
  })
}

export function playLose(): void {
  ;[220, 196, 165].forEach((f, i) => {
    setTimeout(() => tone(f, 0.25, 'sawtooth', 0.04), i * 140)
  })
}

export function playUpgrade(): void {
  tone(600, 0.08, 'triangle', 0.04)
  tone(900, 0.12, 'triangle', 0.04)
}

export function playSell(): void {
  tone(400, 0.1, 'sine', 0.035)
}
