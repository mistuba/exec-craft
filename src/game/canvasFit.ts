/** 画布按整数倍缩放，避免像素被浏览器非整数缩放模糊 */
export function fitPixelCanvas(
  canvas: HTMLCanvasElement,
  wrap: HTMLElement,
  logicalW: number,
  logicalH: number,
): number {
  const maxW = wrap.clientWidth || logicalW
  const scale = Math.max(1, Math.floor(maxW / logicalW))
  const displayW = logicalW * scale
  const displayH = logicalH * scale

  canvas.width = logicalW
  canvas.height = logicalH
  canvas.style.width = `${displayW}px`
  canvas.style.height = `${displayH}px`

  const ctx = canvas.getContext('2d')
  if (ctx) ctx.imageSmoothingEnabled = false

  wrap.style.width = `${displayW}px`
  wrap.style.maxWidth = '100%'

  return scale
}
