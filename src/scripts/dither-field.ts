/*
 * dither-field.ts
 *
 * A monochrome, ordered-dithered "fog field" pixel-art animation.
 *
 * The scene is computed at a low resolution (chunky pixels), passed through an
 * 8x8 Bayer matrix so a handful of gray levels read as a rich, flowing gradient,
 * then blitted to a full-screen canvas with image smoothing disabled so every
 * pixel stays crisp. It fills any aspect ratio, is DPR-aware, and freezes to a
 * single still frame when the visitor prefers reduced motion.
 */

type RGB = [number, number, number]

// A cool near-black to soft white ramp. Neutral, faintly cool — grayscale.
const PALETTE: RGB[] = [
  [8, 9, 12],
  [26, 28, 34],
  [54, 57, 66],
  [96, 100, 112],
  [150, 154, 166],
  [214, 217, 226],
]

// 8x8 Bayer ordered-dither threshold matrix, normalised to (0, 1).
const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => (v + 0.5) / 64))

type Mote = { x: number; y: number; vy: number; vx: number; life: number; ttl: number }

export function startDitherField(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return () => {}
  const ctx: CanvasRenderingContext2D = context

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Low-res buffer. One logical pixel is drawn as a `pixel`-sized block. The
  // block size adapts to the viewport so the per-frame cell budget stays bounded
  // on everything from phones to 4K ultrawides.
  const MAX_CELLS = 52000
  const MIN_PIXEL = 4
  let cols = 0
  let rows = 0
  let field: HTMLCanvasElement
  let fctx: CanvasRenderingContext2D
  let image: ImageData
  let motes: Mote[] = []
  let raf = 0
  let start = performance.now()

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'

    const pixel = Math.max(MIN_PIXEL, Math.ceil(Math.sqrt((w * h) / MAX_CELLS)))
    cols = Math.max(2, Math.ceil(w / pixel))
    rows = Math.max(2, Math.ceil(h / pixel))

    field = document.createElement('canvas')
    field.width = cols
    field.height = rows
    const c = field.getContext('2d')
    if (!c) return
    fctx = c
    image = fctx.createImageData(cols, rows)

    // Seed drifting motes proportional to area.
    const target = Math.round((cols * rows) / 900)
    motes = Array.from({ length: target }, () => spawnMote(true))

    ctx.imageSmoothingEnabled = false
  }

  function spawnMote(anywhere: boolean): Mote {
    return {
      x: Math.random() * cols,
      y: anywhere ? Math.random() * rows : rows + 2,
      vy: -(0.06 + Math.random() * 0.14),
      vx: (Math.random() - 0.5) * 0.05,
      life: 0,
      ttl: 260 + Math.random() * 520,
    }
  }

  // Cheap, smooth value field: layered sines + a soft radial "moon".
  function sampleField(nx: number, ny: number, t: number): number {
    // Slow drifting plasma.
    let v =
      0.5 +
      0.5 *
        Math.sin(nx * 3.1 + t * 0.35) *
        Math.cos(ny * 2.3 - t * 0.24)
    v +=
      0.35 *
      Math.sin((nx + ny) * 2.6 + t * 0.5) *
      Math.sin(ny * 4.2 - t * 0.18)
    v +=
      0.22 * Math.sin(nx * 6.4 - t * 0.6) * Math.cos(ny * 5.1 + t * 0.42)
    v = v / 1.57

    // A soft radial glow (the "moon"), drifting gently, upper region.
    const mx = 0.5 + 0.12 * Math.sin(t * 0.12)
    const my = 0.32 + 0.05 * Math.cos(t * 0.09)
    const dx = nx - mx
    const dy = (ny - my) * 1.0
    const d = Math.sqrt(dx * dx + dy * dy)
    const glow = Math.exp(-d * d * 7.5) * 0.55
    const halo = Math.exp(-d * d * 1.6) * 0.18

    // Gentle vertical falloff so the base sits darker at the edges.
    const vignette = 1 - Math.pow(Math.abs(ny - 0.5) * 1.35, 2) * 0.35

    return clamp01((v * 0.62 + 0.05) * vignette + glow + halo)
  }

  function render(now: number) {
    const t = (now - start) / 1000
    const data = image.data

    for (let y = 0; y < rows; y++) {
      const ny = y / rows
      for (let x = 0; x < cols; x++) {
        const nx = x / cols
        let v = sampleField(nx, ny, t)

        // Ordered dithering across the palette.
        const threshold = (BAYER[y & 7][x & 7] - 0.5) / PALETTE.length
        const idx = clampInt(
          Math.round((v + threshold) * (PALETTE.length - 1)),
          0,
          PALETTE.length - 1,
        )
        const c = PALETTE[idx]
        const o = (y * cols + x) * 4
        data[o] = c[0]
        data[o + 1] = c[1]
        data[o + 2] = c[2]
        data[o + 3] = 255
      }
    }

    // Drifting bright motes: single lit pixels, twinkling.
    for (const m of motes) {
      m.life++
      m.x += m.vx
      m.y += m.vy
      if (m.y < -2 || m.life > m.ttl) {
        Object.assign(m, spawnMote(false))
        continue
      }
      const ix = Math.round(m.x)
      const iy = Math.round(m.y)
      if (ix < 0 || ix >= cols || iy < 0 || iy >= rows) continue
      const fade =
        Math.min(1, m.life / 40) * Math.min(1, (m.ttl - m.life) / 60)
      const twinkle = 0.6 + 0.4 * Math.sin(m.life * 0.2)
      const b = Math.round(150 + 105 * fade * twinkle)
      const o = (iy * cols + ix) * 4
      data[o] = b
      data[o + 1] = b
      data[o + 2] = Math.min(255, b + 4)
      data[o + 3] = 255
    }

    fctx.putImageData(image, 0, 0)
    // Blit low-res buffer to the full canvas, nearest-neighbour = crisp pixels.
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(field, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height)
  }

  function loop(now: number) {
    render(now)
    raf = requestAnimationFrame(loop)
  }

  function begin() {
    cancelAnimationFrame(raf)
    if (reduceMotion.matches) {
      render(performance.now())
      return
    }
    raf = requestAnimationFrame(loop)
  }

  let resizeTimer = 0
  function onResize() {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      resize()
      begin()
    }, 120)
  }

  function onVisibility() {
    if (document.hidden) cancelAnimationFrame(raf)
    else begin()
  }

  resize()
  begin()
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
  reduceMotion.addEventListener('change', begin)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    reduceMotion.removeEventListener('change', begin)
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function clampInt(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}
