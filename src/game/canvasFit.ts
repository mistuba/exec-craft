/** 画布缩放：宽屏用整数倍放大；窄屏缩小以完整显示，避免右侧被裁切 */
export function fitPixelCanvas(
  canvas: HTMLCanvasElement,
  wrap: HTMLElement,
  logicalW: number,
  logicalH: number,
  widthSource?: HTMLElement,
): number {
  const maxW = (widthSource ?? wrap.parentElement ?? wrap).clientWidth || logicalW
  const ratio = maxW / logicalW

  let scale: number
  let displayW: number
  let displayH: number

  if (ratio >= 1) {
    scale = Math.max(1, Math.floor(ratio))
    displayW = logicalW * scale
    displayH = logicalH * scale
  } else {
    scale = ratio
    displayW = maxW
    displayH = logicalH * ratio
  }

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
