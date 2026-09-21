export type SpriteCanvas = HTMLCanvasElement

const cache = new Map<string, SpriteCanvas>()

export function buildSprite(
  rows: string[],
  palette: Record<string, string>,
  key?: string,
): SpriteCanvas {
  if (key && cache.has(key)) return cache.get(key)!

  const h = rows.length
  const w = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  for (let y = 0; y < h; y++) {
    const row = rows[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.' || ch === ' ') continue
      const color = palette[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }
  if (key) cache.set(key, canvas)
  return canvas
}

export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteCanvas,
  centerX: number,
  centerY: number,
  scale: number,
  alpha = 1,
): void {
  const w = sprite.width * scale
  const h = sprite.height * scale
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.globalAlpha = alpha
  const dx = Math.round(centerX - w / 2)
  const dy = Math.round(centerY - h / 2)
  ctx.drawImage(sprite, dx, dy, w, h)
  ctx.restore()
}
