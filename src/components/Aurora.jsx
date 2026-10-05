import { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'

const vertexShader = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColorStops[3];
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 colorRamp(float t) {
  if (t < 0.5) return mix(uColorStops[0], uColorStops[1], t * 2.0);
  return mix(uColorStops[1], uColorStops[2], (t - 0.5) * 2.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float drift = uTime * 0.5;
  float baseWave = 0.68
    + (noise(vec2(uv.x * 2.35 + drift, 1.4 + uTime * 0.42)) - 0.5) * 0.23
    + sin(uv.x * 5.3 - drift * 1.1) * 0.075;
  float secondWave = 0.41
    + (noise(vec2(uv.x * 1.55 - drift * 0.7, 4.8 + uTime * 0.3)) - 0.5) * 0.16
    + sin(uv.x * 3.7 + drift * 1.3) * 0.05;

  float firstDistance = uv.y - baseWave;
  float secondDistance = uv.y - secondWave;
  float firstRibbon = exp(-firstDistance * firstDistance * 72.0);
  float firstGlow = exp(-firstDistance * firstDistance * 14.0);
  float secondRibbon = exp(-secondDistance * secondDistance * 92.0);
  float topFade = smoothstep(0.05, 0.42, uv.y) * (1.0 - smoothstep(0.78, 0.98, uv.y));
  float alpha = (firstRibbon * 0.55 + firstGlow * 0.04 + secondRibbon * 0.32) * topFade;
  vec3 color = colorRamp(uv.x);

  fragColor = vec4(color * alpha, alpha);
}
`

const colorStops = ['#62a8d3', '#91d4f2', '#e1ae43'].map(hex => {
  const color = new Color(hex)
  return [color.r, color.g, color.b]
})

export default function Aurora() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    let renderer
    let observer
    let resizeObserver
    let program
    let rafId = 0
    let elapsed = 0
    let previousFrame = 0
    let heroIsVisible = true
    let contextLost = false
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')

    try {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 620 ? 1 : 1.25)
      renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr: pixelRatio })
      const gl = renderer.gl
      if (!gl) return undefined

      gl.clearColor(0, 0, 0, 0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.canvas.className = 'hero-aurora-canvas'
      gl.canvas.setAttribute('aria-hidden', 'true')
      container.appendChild(gl.canvas)

      const geometry = new Triangle(gl)
      if (geometry.attributes.uv) delete geometry.attributes.uv
      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [container.clientWidth, container.clientHeight] },
          uColorStops: { value: colorStops }
        }
      })
      const scene = new Mesh(gl, { geometry, program })

      const render = time => {
        program.uniforms.uTime.value = time
        renderer.render({ scene })
      }
      const timeScale = 0.8
      const resize = () => {
        const { width, height } = container.getBoundingClientRect()
        if (!width || !height) return
        renderer.setSize(width, height)
        program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight]
        render(elapsed * timeScale)
      }
      const stop = () => {
        if (rafId) cancelAnimationFrame(rafId)
        rafId = 0
        previousFrame = 0
      }
      const animate = timestamp => {
        rafId = 0
        if (contextLost || motionPreference.matches || !heroIsVisible || document.hidden) return
        if (previousFrame) {
          const frameDuration = timestamp - previousFrame
          if (frameDuration < 1000 / 30) {
            rafId = requestAnimationFrame(animate)
            return
          }
          elapsed += Math.min(frameDuration, 100) / 1000
        }
        previousFrame = timestamp
        render(elapsed * timeScale)
        rafId = requestAnimationFrame(animate)
      }
      const syncAnimation = () => {
        if (contextLost) return
        if (motionPreference.matches) {
          stop()
          render(0)
        } else if (heroIsVisible && !document.hidden && !rafId) {
          previousFrame = 0
          rafId = requestAnimationFrame(animate)
        } else if (!heroIsVisible || document.hidden) {
          stop()
        }
      }
      const handleContextLost = event => {
        event.preventDefault()
        contextLost = true
        stop()
      }

      gl.canvas.addEventListener('webglcontextlost', handleContextLost)
      window.addEventListener('resize', resize, { passive: true })
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)
      }
      if ('IntersectionObserver' in window) {
        heroIsVisible = false
        observer = new IntersectionObserver(entries => {
          heroIsVisible = entries.some(entry => entry.isIntersecting)
          syncAnimation()
        }, { threshold: 0.01 })
        observer.observe(container.closest('.hero') ?? container)
      }
      const handleVisibilityChange = () => syncAnimation()
      const handleMotionChange = () => syncAnimation()
      document.addEventListener('visibilitychange', handleVisibilityChange)
      if (motionPreference.addEventListener) motionPreference.addEventListener('change', handleMotionChange)
      else motionPreference.addListener(handleMotionChange)

      resize()
      render(0)
      syncAnimation()

      return () => {
        stop()
        observer?.disconnect()
        resizeObserver?.disconnect()
        window.removeEventListener('resize', resize)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        if (motionPreference.removeEventListener) motionPreference.removeEventListener('change', handleMotionChange)
        else motionPreference.removeListener(handleMotionChange)
        gl.canvas.removeEventListener('webglcontextlost', handleContextLost)
        if (gl.canvas.parentNode === container) container.removeChild(gl.canvas)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    } catch {
      renderer?.gl?.getExtension('WEBGL_lose_context')?.loseContext()
      return undefined
    }
  }, [])

  return <div className="hero-aurora-renderer" ref={containerRef} />
}
