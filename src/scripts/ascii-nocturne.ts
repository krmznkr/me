/*
 * ascii-nocturne.ts
 *
 * The nocturne moon rendered as monochrome character-art: the scene is sampled
 * on a monospace character grid, and each cell's luminance is mapped to a glyph
 * from a density ramp and a gray from the palette. Same idea as an image→ASCII
 * converter (à la the browser-use footer art), but grayscale, in Geist Mono,
 * and driven by a live 3D-lit moon instead of a photo.
 */

// Dark -> light density ramp. Rounded forms read softly at a distance.
const RAMP = " .·:-=+ico*O0@'".slice(0, 14)

export function startAsciiNocturne(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return () => {}
  const ctx: CanvasRenderingContext2D = context

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const BG = '#060608'

  // Precomputed gray ramp colours (index-matched to RAMP), faintly cool.
  const COLORS = RAMP.split('').map((_, i) => {
    const t = i / (RAMP.length - 1)
    const g = Math.round(22 + Math.pow(t, 0.92) * (238 - 22))
    return `rgb(${g},${g},${Math.min(255, g + 3)})`
  })
  const STAR_COLOR = 'rgb(236,236,234)'

  let dpr = 1
  let cw = 0 // character cell width (css px)
  let ch = 0 // character cell height (css px)
  let cols = 0
  let rows = 0
  let fontSize = 14
  let stars: { cx: number; cy: number; base: number; amp: number; speed: number; phase: number }[] = []
  let raf = 0
  let lastDraw = 0
  const start = performance.now()

  // Moon geometry in css px.
  let moonX = 0
  let moonY = 0
  let moonR = 0
  const L = normalize(0.42, -0.46, 0.78)

  function measureCell() {
    ctx.font = `${fontSize}px 'Geist Mono Variable', ui-monospace, monospace`
    const m = ctx.measureText('0')
    cw = m.width || fontSize * 0.6
    ch = fontSize * 1.32
  }

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Aim for a comfortable glyph count on any screen.
    fontSize = clamp(Math.round(Math.min(w, h) / 70), 9, 15)
    measureCell()
    cols = Math.ceil(w / cw) + 1
    rows = Math.ceil(h / ch) + 1

    const landscape = w / h >= 1.15
    const base = Math.min(w, h)
    if (landscape) {
      moonX = w * 0.72
      moonY = h * 0.36
      moonR = base * 0.22
    } else {
      moonX = w * 0.52
      moonY = h * 0.28
      moonR = base * 0.3
    }

    seedStars(w, h)
    ctx.textBaseline = 'top'
  }

  function seedStars(w: number, h: number) {
    const rand = mulberry32(0x1a2b3c4d)
    const count = Math.round((cols * rows) / 210)
    stars = []
    let guard = 0
    while (stars.length < count && guard++ < count * 40) {
      const cx = Math.floor(rand() * cols)
      const cy = Math.floor(rand() * rows)
      const px = cx * cw
      const py = cy * ch
      if (Math.hypot(px - moonX, py - moonY) < moonR * 1.9) continue
      // Keep stars in the sky; the lower band belongs to the hero text.
      if (py > h * 0.56) continue
      const bright = rand()
      stars.push({
        cx,
        cy,
        base: 0.3 + bright * 0.45,
        amp: bright > 0.85 ? 0.3 : 0.08 + rand() * 0.1,
        speed: 0.3 + rand() * 0.9,
        phase: rand() * Math.PI * 2,
      })
    }
  }

  function surface(u: number, v: number, t: number): number {
    const a = vnoise(u * 2.1 + t, v * 2.1)
    const b = vnoise(u * 4.7 - t * 0.6, v * 4.7 + 3.1)
    return a * 0.68 + b * 0.32
  }

  function luminanceAt(px: number, py: number, t: number, rot: number, glow: number): number {
    let val = 0
    const dx = (px - moonX) / moonR
    const dy = (py - moonY) / moonR
    const rr = dx * dx + dy * dy
    if (rr <= 1) {
      const z = Math.sqrt(1 - rr)
      let diff = dx * L[0] + dy * L[1] + z * L[2]
      diff = diff < 0 ? 0 : diff
      diff = diff * diff * (3 - 2 * diff)
      const maria = surface(dx, dy, rot)
      const albedo = 0.7 + maria * 0.3
      const limb = 0.8 + 0.2 * z
      val = (0.08 + diff * albedo) * limb
    } else {
      const d = Math.sqrt(rr) - 1
      val = Math.exp(-d * 2.7) * glow + Math.exp(-d * 0.8) * glow * 0.34
    }
    // Lift the mid-tones so the moon reads bright and present.
    val = Math.pow(val < 0 ? 0 : val, 0.82) * 1.14
    return val > 1 ? 1 : val
  }

  function render(now: number) {
    const t = (now - start) / 1000
    const rot = t * 0.02
    const glow = 0.16 + 0.03 * (0.5 + 0.5 * Math.sin(t * 0.3))

    ctx.fillStyle = BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = `${fontSize}px 'Geist Mono Variable', ui-monospace, monospace`

    const shimmer = reduceMotion.matches ? 0 : 1
    for (let j = 0; j < rows; j++) {
      const py = j * ch + ch * 0.5
      for (let i = 0; i < cols; i++) {
        const px = i * cw + cw * 0.5
        let lum = luminanceAt(px, py, t, rot, glow)
        // A whisper of temporal shimmer so mid-tones feel alive.
        if (shimmer && lum > 0.02 && lum < 0.85) {
          lum += (vnoise(i * 0.6 + t * 1.3, j * 0.6) - 0.5) * 0.06
        }
        if (lum <= 0.03) continue
        const idx = clampInt(Math.round(lum * (RAMP.length - 1)), 1, RAMP.length - 1)
        const glyph = RAMP[idx]
        if (glyph === ' ') continue
        ctx.fillStyle = COLORS[idx]
        ctx.fillText(glyph, i * cw, j * ch)
      }
    }

    // Stars on empty sky.
    for (const s of stars) {
      const tw = reduceMotion.matches ? s.base : s.base + Math.sin(t * s.speed + s.phase) * s.amp
      if (tw < 0.28) continue
      const idx = clampInt(Math.round(tw * (RAMP.length - 1)), 1, RAMP.length - 1)
      ctx.fillStyle = tw > 0.75 ? STAR_COLOR : COLORS[idx]
      ctx.fillText(tw > 0.7 ? '+' : '·', s.cx * cw, s.cy * ch)
    }
  }

  function loop(now: number) {
    // ~34fps: calm, and fillText-friendly.
    if (now - lastDraw >= 29) {
      render(now)
      lastDraw = now
    }
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

  const boot = () => {
    resize()
    begin()
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot)
  } else {
    boot()
  }
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
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}
function clampInt(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
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
