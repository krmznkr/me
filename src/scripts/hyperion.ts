import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

type SceneHandle = {
  dispose: () => void
  toggleMotion: () => boolean
}

const BACKGROUND = 0x060608

export async function startHyperion(canvas: HTMLCanvasElement): Promise<SceneHandle> {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BACKGROUND)
  scene.fog = new THREE.FogExp2(BACKGROUND, 0.026)

  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 160)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.72

  const environment = new THREE.PMREMGenerator(renderer)
  scene.environment = environment.fromScene(new RoomEnvironment(), 0.02).texture
  environment.dispose()

  const ship = new THREE.Group()
  scene.add(ship)

  const gltf = await new GLTFLoader().loadAsync('/models/hyperion.glb')
  const model = gltf.scene
  orientAndFit(model, 10.8)
  stylise(model)
  ship.add(model)

  const key = new THREE.DirectionalLight(0xe9edf2, 4.1)
  key.position.set(-6, 9, 11)
  scene.add(key)

  const rim = new THREE.DirectionalLight(0x7aa6bd, 2.1)
  rim.position.set(9, 1, -10)
  scene.add(rim)

  const underlight = new THREE.DirectionalLight(0x635a76, 0.85)
  underlight.position.set(2, -8, 4)
  scene.add(underlight)

  addStars(scene, 0x9ca8b2, 680, 23, 78)
  addStars(scene, 0xe6e7e8, 70, 28, 90, 0.045)

  let width = 0
  let height = 0
  let frame = 0
  let visible = true
  let manuallyPaused = false
  let pointerX = 0
  let pointerY = 0
  let targetX = 0
  let targetY = 0
  let dragging = false
  let dragX = 0
  let dragRotation = 0
  const clock = new THREE.Clock()

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    const portrait = width / height < 0.9

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.35 : 1.75))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.position.set(portrait ? -0.4 : -1.2, portrait ? 2.7 : 1.7, portrait ? 19.5 : 17.2)
    camera.lookAt(portrait ? 0 : 1.9, portrait ? 0.8 : 0.2, 0)
    camera.updateProjectionMatrix()

    ship.position.set(portrait ? 0.5 : 3.4, portrait ? 2.5 : 0.75, 0)
    ship.scale.setScalar(portrait ? 0.78 : 1)
    render()
  }

  function render() {
    renderer.render(scene, camera)
  }

  function animate() {
    frame = requestAnimationFrame(animate)
    if (!visible) return

    const elapsed = clock.getElapsedTime()
    const moving = !reduceMotion.matches && !manuallyPaused
    const drift = moving ? elapsed : 0
    pointerX += (targetX - pointerX) * 0.035
    pointerY += (targetY - pointerY) * 0.035

    ship.rotation.x = -0.08 + pointerY * 0.09 + Math.sin(drift * 0.19) * (moving ? 0.022 : 0)
    ship.rotation.y = -0.2 + dragRotation + pointerX * 0.12 + drift * (moving ? 0.018 : 0)
    ship.rotation.z = -0.055 + pointerX * 0.035 + Math.sin(drift * 0.27) * (moving ? 0.018 : 0)
    ship.position.y += ((width / height < 0.9 ? 2.5 : 0.75) + Math.sin(drift * 0.31) * (moving ? 0.08 : 0) - ship.position.y) * 0.04
    render()
  }

  function onPointerMove(event: PointerEvent) {
    targetX = (event.clientX / Math.max(width, 1) - 0.5) * 2
    targetY = (event.clientY / Math.max(height, 1) - 0.5) * 2
    if (dragging) dragRotation += (event.clientX - dragX) * 0.004
    dragX = event.clientX
  }

  function onPointerDown(event: PointerEvent) {
    dragging = true
    dragX = event.clientX
    canvas.setPointerCapture(event.pointerId)
    canvas.classList.add('is-dragging')
  }

  function onPointerUp(event: PointerEvent) {
    dragging = false
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    canvas.classList.remove('is-dragging')
  }

  function onVisibility() {
    visible = !document.hidden
    if (visible) clock.getDelta()
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)

  resize()
  document.documentElement.classList.add('scene-ready')
  animate()

  return {
    toggleMotion() {
      manuallyPaused = !manuallyPaused
      return manuallyPaused
    },
    dispose() {
      cancelAnimationFrame(frame)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.dispose()
    },
  }
}

function orientAndFit(model: THREE.Object3D, targetLength: number) {
  const original = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
  const longest = Math.max(original.x, original.y, original.z)
  if (longest === original.y) model.rotation.z = -Math.PI / 2
  if (longest === original.z) model.rotation.y = Math.PI / 2
  model.updateMatrixWorld(true)

  const bounds = new THREE.Box3().setFromObject(model)
  const size = bounds.getSize(new THREE.Vector3())
  model.scale.setScalar(targetLength / size.x)
  model.updateMatrixWorld(true)
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
  model.position.sub(center)
}

function stylise(model: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return

    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material]
    const materials = sourceMaterials.map((source) => {
      const sourceColor = 'color' in source && source.color instanceof THREE.Color
        ? source.color.clone()
        : new THREE.Color(0x879196)
      const hsl = { h: 0, s: 0, l: 0 }
      sourceColor.getHSL(hsl)
      sourceColor.setHSL(hsl.h, Math.min(hsl.s * 0.22, 0.08), Math.max(0.12, hsl.l * 0.78))

      return new THREE.MeshStandardMaterial({
        color: sourceColor,
        map: 'map' in source && source.map instanceof THREE.Texture ? source.map : null,
        roughness: 0.72,
        metalness: 0.28,
        transparent: source.transparent,
        opacity: source.opacity,
        alphaTest: source.alphaTest,
        side: source.side,
      })
    })
    object.material = Array.isArray(object.material) ? materials : materials[0]

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(object.geometry, 34),
      new THREE.LineBasicMaterial({
        color: 0xaab5bc,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    )
    object.add(edges)
  })
}

function addStars(
  scene: THREE.Scene,
  color: number,
  count: number,
  near: number,
  far: number,
  size = 0.024,
) {
  const random = mulberry32(count * 144)
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const radius = near + random() * (far - near)
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })))
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
