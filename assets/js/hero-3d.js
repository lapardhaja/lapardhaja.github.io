/**
 * Hero WebGL — transportation-themed: roadway, lane traffic, network overlay (Three.js)
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

    const cyan = 0x38bdf8
    const mint = 0x34d399
    const asphalt = 0x151d2e

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0, 1.15, 5.1)
    camera.lookAt(0, -0.35, -4)

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    scene.add(new THREE.AmbientLight(0x445566, 0.45))

    const sun = new THREE.DirectionalLight(0xffffff, 0.55)
    sun.position.set(-3, 8, 6)
    scene.add(sun)

    const fill = new THREE.DirectionalLight(cyan, 0.35)
    fill.position.set(5, 2, -2)
    scene.add(fill)

    const rim = new THREE.PointLight(mint, 0.6, 18)
    rim.position.set(3, 0.5, 2)
    scene.add(rim)

    const world = new THREE.Group()
    scene.add(world)

    // --- Road deck (stylized freeway segment receding into the distance)
    const roadGeo = new THREE.BoxGeometry(6.2, 0.06, 20)
    const roadMat = new THREE.MeshStandardMaterial({
        color: asphalt,
        roughness: 0.92,
        metalness: 0.08,
    })
    const road = new THREE.Mesh(roadGeo, roadMat)
    road.position.set(0, -1.05, -1.2)
    world.add(road)

    // Edge barriers / shoulders (subtle)
    const edgeGeo = new THREE.BoxGeometry(6.4, 0.04, 20)
    const edgeMat = new THREE.MeshStandardMaterial({
        color: 0x0d1522,
        roughness: 0.85,
    })
    const edgeL = new THREE.Mesh(edgeGeo, edgeMat)
    edgeL.position.set(-3.15, -1.02, -1.2)
    const edgeR = edgeL.clone()
    edgeR.position.x = 3.15
    world.add(edgeL, edgeR)

    // Dashed lane markings (instanced thin boxes)
    const dashLen = 0.45
    const dashGap = 0.38
    const dashGeo = new THREE.BoxGeometry(0.06, 0.02, dashLen)
    const dashMat = new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.55,
    })
    const dashesPerStripe = 14
    const stripeCount = 2
    const dashCount = dashesPerStripe * stripeCount
    const dashes = new THREE.InstancedMesh(dashGeo, dashMat, dashCount)
    const dashDummy = new THREE.Object3D()
    let di = 0
    const stripeX = [-1.02, 1.02]
    const zStart = 2.5
    for (let s = 0; s < stripeCount; s++) {
        for (let d = 0; d < dashesPerStripe; d++) {
            const z = zStart - d * (dashLen + dashGap)
            dashDummy.position.set(stripeX[s], -0.98, -1.2 + z)
            dashDummy.updateMatrix()
            dashes.setMatrixAt(di++, dashDummy.matrix)
        }
    }
    dashes.instanceMatrix.needsUpdate = true
    world.add(dashes)

    // --- Vehicles: instanced boxes in 3 lanes (traffic flow along -Z)
    const laneXs = [-1.55, 0, 1.55]
    const carsPerLane = 10
    const carCount = laneXs.length * carsPerLane
    const carGeo = new THREE.BoxGeometry(0.34, 0.14, 0.2)
    const carMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: cyan,
        emissiveIntensity: 0.25,
        metalness: 0.55,
        roughness: 0.35,
    })
    const cars = new THREE.InstancedMesh(carGeo, carMat, carCount)
    const carDummy = new THREE.Object3D()
    const carZ = new Float32Array(carCount)
    const carSpeed = new Float32Array(carCount)
    let ci = 0
    for (let L = 0; L < laneXs.length; L++) {
        for (let k = 0; k < carsPerLane; k++) {
            const idx = ci++
            carZ[idx] = 4 - k * 2.1 - L * 0.17
            carSpeed[idx] = 2.2 + (idx % 5) * 0.35 + Math.random() * 0.4
            carDummy.position.set(laneXs[L], -0.92, -1.2 + carZ[idx])
            carDummy.rotation.y = Math.PI
            carDummy.updateMatrix()
            cars.setMatrixAt(idx, carDummy.matrix)
        }
    }
    cars.instanceMatrix.needsUpdate = true
    world.add(cars)

    // --- Network / systems overlay: nodes + edges (OD graph, transit network abstraction)
    const nodePositions = [
        new THREE.Vector3(-2.2, 0.35, -0.5),
        new THREE.Vector3(0, 0.55, -2.8),
        new THREE.Vector3(2.1, 0.4, -1.2),
        new THREE.Vector3(-1.4, 0.45, -4.2),
        new THREE.Vector3(1.6, 0.5, -5),
    ]
    const nodeGeo = new THREE.SphereGeometry(0.07, 10, 10)
    const nodeMat = new THREE.MeshStandardMaterial({
        color: mint,
        emissive: mint,
        emissiveIntensity: 0.9,
        metalness: 0.2,
        roughness: 0.5,
        transparent: true,
        opacity: 0.9,
    })
    const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodePositions.length)
    const nodeDummy = new THREE.Object3D()
    nodePositions.forEach((p, i) => {
        nodeDummy.position.copy(p)
        nodeDummy.updateMatrix()
        nodes.setMatrixAt(i, nodeDummy.matrix)
    })
    nodes.instanceMatrix.needsUpdate = true
    world.add(nodes)

    const edgePairs = [
        [0, 1],
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 4],
    ]
    const edgeMat = new THREE.LineBasicMaterial({
        color: cyan,
        transparent: true,
        opacity: 0.35,
    })
    edgePairs.forEach(([a, b]) => {
        const geo = new THREE.BufferGeometry().setFromPoints([nodePositions[a], nodePositions[b]])
        world.add(new THREE.Line(geo, edgeMat))
    })

    // Subtle horizon glow (urban night)
    const glowGeo = new THREE.PlaneGeometry(24, 8)
    const glowMat = new THREE.MeshBasicMaterial({
        color: cyan,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
        depthWrite: false,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.set(0, -0.2, -12)
    world.add(glow)

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
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden
    })

    const clock = new THREE.Clock()
    let t = 0

    function frame() {
        requestAnimationFrame(frame)
        if (!running) return

        const dt = clock.getDelta()
        t += dt

        // Traffic: advance along road (-Z direction in world space)
        ci = 0
        for (let L = 0; L < laneXs.length; L++) {
            for (let k = 0; k < carsPerLane; k++) {
                const idx = ci++
                carZ[idx] -= carSpeed[idx] * dt
                if (carZ[idx] < -11) carZ[idx] = 7
                carDummy.position.set(laneXs[L], -0.92, -1.2 + carZ[idx])
                carDummy.rotation.y = Math.PI
                carDummy.updateMatrix()
                cars.setMatrixAt(idx, carDummy.matrix)
            }
        }
        cars.instanceMatrix.needsUpdate = true

        camera.position.x = Math.sin(t * 0.2) * 0.06
        camera.position.y = 1.15 + Math.cos(t * 0.15) * 0.04
        camera.lookAt(0, -0.35, -4)
        rim.position.x = 2.8 + Math.sin(t * 0.5) * 0.2

        renderer.render(scene, camera)
    }

    frame()
}

init()
