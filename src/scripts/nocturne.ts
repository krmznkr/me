/*
 * nocturne.ts
 *
 * A quiet monochrome nightscape rendered as chunky pixel art:
 *   - one dithered pixel moon, side-lit with a soft terminator and faint maria,
 *   - a broad, gentle halo that fades into the black,
 *   - a sparse scatter of stars, a few of them slowly breathing.
 *
 * The scene is computed at a low resolution and blitted with smoothing off, so
 * every pixel stays crisp. The moon is placed with intent (off-centre in
 * landscape, high-centre in portrait) so the type always has its own dark,
 * uncluttered space. Motion is slow; it freezes to a single frame under
 * prefers-reduced-motion.
 */

type Star = { x: number; y: number; base: number; amp: number; speed: number; phase: number; size: number }

export function startNocturne(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return () => {}
  const ctx: CanvasRenderingContext2D = context

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const MAX_CELLS = 46000
  const MIN_PIXEL = 4
  const LEVELS = 7 // quantised gray bands

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
  ]

  let cols = 0
  let rows = 0
  let field: HTMLCanvasElement
  let fctx: CanvasRenderingContext2D
  let image: ImageData
  let stars: Star[] = []
  let raf = 0
  const start = performance.now()

  // Moon placement in low-res cell units.
  let moonX = 0
  let moonY = 0
  let moonR = 0

  // Light from the upper-right, mostly frontal — a softly shaded gibbous moon.
  const L = normalize(0.42, -0.46, 0.78)

  function layout() {
    const w = window.innerWidth
    const h = window.innerHeight
    const landscape = w / h >= 1.15
    const base = Math.min(cols, rows)
    if (landscape) {
      moonX = cols * 0.72
      moonY = rows * 0.36
      moonR = base * 0.19
    } else {
      moonX = cols * 0.52
      moonY = rows * 0.3
      moonR = base * 0.24
    }
  }

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

    layout()
    seedStars()
    ctx.imageSmoothingEnabled = false
  }

  function seedStars() {
    const rand = mulberry32(0x9e3779b9)
    const count = Math.round((cols * rows) / 5200)
    stars = []
    let guard = 0
    while (stars.length < count && guard++ < count * 40) {
      const x = rand() * cols
      const y = rand() * rows
      // Keep clear of the moon and its inner halo.
      const d = Math.hypot(x - moonX, y - moonY)
      if (d < moonR * 2.15) continue
      const bright = rand()
      stars.push({
        x,
        y,
        base: 0.28 + bright * 0.5,
        amp: bright > 0.82 ? 0.28 + rand() * 0.22 : 0.06 + rand() * 0.1,
        speed: 0.25 + rand() * 0.9,
        phase: rand() * Math.PI * 2,
        size: bright > 0.9 ? 2 : 1,
      })
    }
  }

  // Low-frequency value noise for the lunar maria.
  function surface(u: number, v: number, t: number): number {
    const a = vnoise(u * 2.1 + t, v * 2.1)
    const b = vnoise(u * 4.7 - t * 0.6, v * 4.7 + 3.1)
    const c = vnoise(u * 9.3, v * 9.3 - t * 0.3)
    return a * 0.6 + b * 0.28 + c * 0.12
  }

  function render(now: number) {
    const t = (now - start) / 1000
    const data = image.data
    const rot = t * 0.02 // very slow lunar drift
    const glowPulse = 0.5 + 0.5 * Math.sin(t * 0.32)
    const glowStrength = 0.1 + glowPulse * 0.03
    const invR = 1 / moonR

    for (let y = 0; y < rows; y++) {
      const by = BAYER[y & 7]
      for (let x = 0; x < cols; x++) {
        // Pure black sky — only the moon, its glow and the stars lift off it.
        let v = 0

        const dx = (x - moonX) * invR
        const dy = (y - moonY) * invR
        const rr = dx * dx + dy * dy

        if (rr <= 1) {
          // Inside the moon.
          const z = Math.sqrt(1 - rr)
          let diff = dx * L[0] + dy * L[1] + z * L[2]
          diff = diff < 0 ? 0 : diff
          // Soft terminator.
          diff = diff * diff * (3 - 2 * diff)
          const maria = surface(dx, dy, rot)
          const albedo = 0.72 + maria * 0.28
          const limb = 0.82 + 0.18 * z
          v = (0.05 + diff * albedo) * limb
        } else {
          // Outer halo, fading with distance from the limb.
          const d = Math.sqrt(rr) - 1
          const halo = Math.exp(-d * 3.4) * glowStrength
          const wide = Math.exp(-d * 0.9) * glowStrength * 0.35
          v += halo + wide
        }

        // Ordered dithering to clean gray bands.
        const threshold = (by[x & 7] + 0.5) / 64 - 0.5
        let q = Math.round((v + threshold / LEVELS) * (LEVELS - 1))
        if (q < 0) q = 0
        else if (q > LEVELS - 1) q = LEVELS - 1
        const g = Math.round((q / (LEVELS - 1)) * 255)

        const o = (y * cols + x) * 4
        data[o] = g
        data[o + 1] = g
        data[o + 2] = g
        data[o + 3] = 255
      }
    }

    // Stars, drawn crisp on top.
    for (const s of stars) {
      const tw = reduceMotion.matches
        ? s.base
        : s.base + Math.sin(t * s.speed + s.phase) * s.amp
      const g = Math.round(clamp01(tw) * 255)
      putCell(data, Math.round(s.x), Math.round(s.y), g)
      if (s.size === 2) putCell(data, Math.round(s.x) + 1, Math.round(s.y), Math.round(g * 0.7))
    }

    fctx.putImageData(image, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(field, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height)
  }

  function putCell(data: Uint8ClampedArray, x: number, y: number, g: number) {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return
    const o = (y * cols + x) * 4
    if (g <= data[o]) return
    data[o] = g
    data[o + 1] = g
    data[o + 2] = g
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

function normalize(x: number, y: number, z: number): [number, number, number] {
  const m = Math.hypot(x, y, z) || 1
  return [x / m, y / m, z / m]
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

// Deterministic PRNG so the star field is stable across frames and reloads.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Cheap hash-based value noise in [0, 1].
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
