import * as THREE from 'three'
import { useMemo, useState, useRef } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import './shaders/simulationMaterial'
import './shaders/dofPointsMaterial'

export function Particles({ speed, fov, aperture, focus, curl, size = 512, windX = -1, windY = 0, windSpeed = 1.0, fallSpeed = 0.4, windOsc = 1.0, sizeMode = 'fixed', sizeFixed = 3, sizeMin = 1, sizeMax = 5, attractionRadius = 1.0, attractionStrength = 0.8, vortexStrength = 1.5, vortexSpeed = 1.0, vortexColor = '#ff6600', vortexIntensity = 3.0, glowIntensity = 2.0, glowSize = 1.5, centerGlowRadius = 3.0, centerGlowIntensity = 2.0, ...props }) {
  const simRef = useRef()
  const renderRef = useRef()
  // Ref for smooth speed transition
  const currentSpeedRef = useRef(speed)
  // Ref for accumulated time with variable speed
  const accumulatedTimeRef = useRef(0)

  const { viewport, camera: mainCamera } = useThree()
  const mousePos = useRef(new THREE.Vector3(0, 0, 0))
  const [mouseActive, setMouseActive] = useState(false)

  // Convertir color hex a RGB normalizado
  const vortexColorRGB = useMemo(() => {
    const hex = vortexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    return new THREE.Vector3(r, g, b)
  }, [vortexColor])
  // Set up FBO
  const [scene] = useState(() => new THREE.Scene())
  const [camera] = useState(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1))
  const [positions] = useState(() => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]))
  const [uvs] = useState(() => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]))
  const target = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType
  })
  // Normalize points
  const particles = useMemo(() => {
    const length = size * size
    const particles = new Float32Array(length * 3)
    for (let i = 0; i < length; i++) {
      let i3 = i * 3
      particles[i3 + 0] = (i % size) / size
      particles[i3 + 1] = i / size / size
    }
    return particles
  }, [size])

  // Track mouse and touch movement
  useMemo(() => {
    const updatePosition = (clientX, clientY) => {
      const x = (clientX / window.innerWidth) * 2 - 1
      const y = -(clientY / window.innerHeight) * 2 + 1

      const vec = new THREE.Vector3(x, y, 0.5)
      vec.unproject(mainCamera)
      vec.sub(mainCamera.position).normalize()
      const distance = -mainCamera.position.z / vec.z
      mousePos.current.copy(mainCamera.position).add(vec.multiplyScalar(distance))
      setMouseActive(true)
    }

    const handleMouseMove = (event) => {
      updatePosition(event.clientX, event.clientY)
    }

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        event.preventDefault()
        updatePosition(event.touches[0].clientX, event.touches[0].clientY)
      }
    }

    const handleTouchStart = (event) => {
      if (event.touches.length > 0) {
        updatePosition(event.touches[0].clientX, event.touches[0].clientY)
      }
    }

    const handleEnd = () => {
      setMouseActive(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleEnd)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    window.addEventListener('touchcancel', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleEnd)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('touchcancel', handleEnd)
    }
  }, [mainCamera])
  // Update FBO and pointcloud every frame
  useFrame((state, delta) => {
    if (!renderRef.current || !simRef.current) return
    state.gl.setRenderTarget(target)
    state.gl.clear()
    state.gl.render(scene, camera)
    state.gl.setRenderTarget(null)
    renderRef.current.uniforms.positions.value = target.texture
    renderRef.current.uniforms.uTime.value = state.clock.elapsedTime
    renderRef.current.uniforms.uFocus.value = focus
    renderRef.current.uniforms.uFov.value = fov
    renderRef.current.uniforms.uBlur.value = (5.6 - aperture) * 9

    // 1. Lerp current speed towards target speed for smooth transition
    currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, speed, 0.05)

    // 2. Accumulate time with variable speed (prevents backwards motion)
    accumulatedTimeRef.current += delta * currentSpeedRef.current

    // 3. Use accumulated time instead of multiplied elapsed time
    simRef.current.uniforms.uTime.value = accumulatedTimeRef.current
    simRef.current.uniforms.uWindDir.value.set(windX, windY)
    simRef.current.uniforms.uWindSpeed.value = windSpeed
    simRef.current.uniforms.uFallSpeed.value = fallSpeed
    simRef.current.uniforms.uWindOsc.value = windOsc
    simRef.current.uniforms.uMousePos.value = mousePos.current
    simRef.current.uniforms.uMouseActive.value = mouseActive ? 1.0 : 0.0
    simRef.current.uniforms.uAttractionRadius.value = attractionRadius
    simRef.current.uniforms.uAttractionStrength.value = attractionStrength
    simRef.current.uniforms.uVortexStrength.value = vortexStrength
    simRef.current.uniforms.uVortexSpeed.value = vortexSpeed
    renderRef.current.uniforms.uMousePos.value = mousePos.current
    renderRef.current.uniforms.uMouseActive.value = mouseActive ? 1.0 : 0.0
    renderRef.current.uniforms.uAttractionRadius.value = attractionRadius
    renderRef.current.uniforms.uVortexColor.value = vortexColorRGB
    renderRef.current.uniforms.uVortexIntensity.value = vortexIntensity
    renderRef.current.uniforms.uGlowIntensity.value = glowIntensity
    renderRef.current.uniforms.uGlowSize.value = glowSize
    renderRef.current.uniforms.uCenterGlowRadius.value = centerGlowRadius
    renderRef.current.uniforms.uCenterGlowIntensity.value = centerGlowIntensity
    renderRef.current.uniforms.uSizeMode.value = sizeMode === 'random' ? 1 : 0
    renderRef.current.uniforms.uSizeFixed.value = sizeFixed
    renderRef.current.uniforms.uSizeMin.value = sizeMin
    renderRef.current.uniforms.uSizeMax.value = sizeMax
  })
  return (
    <>
      {/* Simulation goes into a FBO/Off-buffer */}
      {createPortal(
        <mesh>
          <simulationMaterial ref={simRef} />
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} />
          </bufferGeometry>
        </mesh>,
        scene
      )}
      {/* The result of which is forwarded into a pointcloud via data-texture */}
      <points {...props}>
        <dofPointsMaterial ref={renderRef} />
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
        </bufferGeometry>
      </points>
    </>
  )
}