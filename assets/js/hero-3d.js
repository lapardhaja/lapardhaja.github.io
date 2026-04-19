/**
 * Hero WebGL background — Three.js (loads from CDN via import map)
 */
import * as THREE from 'three'

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function webglSupported() {
    try {
        const c = document.createElement('canvas')
        return !!(window.WebGLRenderingContext && c.getContext('webgl'))
    } catch {
        return false
    }
}

function init() {
    const canvas = document.getElementById('hero-canvas')
    if (!canvas || REDUCED_MOTION || !webglSupported()) {
        if (canvas) canvas.remove()
        return
    }

    const container = document.getElementById('hero')
    if (!container) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0.2, 5.2)

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const cyan = 0x38bdf8
    const mint = 0x34d399

    const ambient = new THREE.AmbientLight(0x404060, 0.35)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(4, 6, 5)
    scene.add(key)

    const ptA = new THREE.PointLight(cyan, 1.2, 12)
    ptA.position.set(-2.5, 1, 2)
    scene.add(ptA)

    const ptB = new THREE.PointLight(mint, 1.0, 12)
    ptB.position.set(2.5, -1, 2)
    scene.add(ptB)

    const mainGroup = new THREE.Group()
    scene.add(mainGroup)

    const coreGeo = new THREE.IcosahedronGeometry(1.15, 1)
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x0c1222,
        emissive: cyan,
        emissiveIntensity: 0.35,
        metalness: 0.65,
        roughness: 0.25,
        flatShading: true,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    mainGroup.add(core)

    const ringGeo = new THREE.TorusGeometry(1.85, 0.02, 16, 100)
    const ringMat = new THREE.MeshBasicMaterial({
        color: cyan,
        transparent: true,
        opacity: 0.45,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2.3
    mainGroup.add(ring)

    const ring2 = ring.clone()
    ring2.scale.setScalar(1.12)
    ring2.material = ringMat.clone()
    ring2.material.opacity = 0.22
    ring2.rotation.z = 0.4
    mainGroup.add(ring2)

    const nodeCount = 48
    const nodeGeo = new THREE.SphereGeometry(0.08, 12, 12)
    const nodeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: mint,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.4,
    })
    const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount)
    const dummy = new THREE.Object3D()
    const r = 2.15
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < nodeCount; i++) {
        const y = 1 - (i / Math.max(1, nodeCount - 1)) * 2
        const rad = Math.sqrt(1 - y * y)
        const theta = golden * i
        dummy.position.set(Math.cos(theta) * rad * r, y * r, Math.sin(theta) * rad * r)
        dummy.updateMatrix()
        nodes.setMatrixAt(i, dummy.matrix)
    }
    nodes.instanceMatrix.needsUpdate = true
    mainGroup.add(nodes)

    const particleCount = 900
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 14
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pMat = new THREE.PointsMaterial({
        color: cyan,
        size: 0.035,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })
    const dust = new THREE.Points(pGeo, pMat)
    dust.position.z = -1
    scene.add(dust)

    let width = 0
    let height = 0

    function resize() {
        const rect = container.getBoundingClientRect()
        width = rect.width
        height = Math.max(rect.height, 1)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let running = true
    const onVis = () => {
        running = !document.hidden
    }
    document.addEventListener('visibilitychange', onVis)

    const clock = new THREE.Clock()
    let t = 0

    function frame() {
        requestAnimationFrame(frame)
        if (!running) return

        const dt = clock.getDelta()
        t += dt

        mainGroup.rotation.y += 0.35 * dt
        mainGroup.rotation.x = Math.sin(t * 0.25) * 0.12
        ring.rotation.z += 0.4 * dt
        ring2.rotation.z -= 0.25 * dt
        dust.rotation.y += 0.05 * dt

        camera.position.x = Math.sin(t * 0.15) * 0.15
        camera.position.y = Math.cos(t * 0.12) * 0.08
        camera.lookAt(0, 0, 0)

        ptA.position.x = -2.5 + Math.sin(t * 0.7) * 0.4
        ptB.position.x = 2.5 + Math.cos(t * 0.55) * 0.35

        renderer.render(scene, camera)
    }

    frame()
}

init()
