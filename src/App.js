import { OrbitControls } from '@react-three/drei'
import { Particles } from './Particles'
import { useControls } from 'leva'
import { useState, useEffect } from 'react'

export default function App() {
  const [dynamicSpeed, setDynamicSpeed] = useState(0.01)

  // Escuchar cambios en glitchIntensity
  useEffect(() => {
    const handleGlitchChange = (event) => {
      const intensity = event.detail
      // Calcular speed: de 0.01 (sin glitch) a 0.5 (glitch máximo)
      const newSpeed = 0.01 + (intensity * 0.49)
      setDynamicSpeed(newSpeed)
    }

    window.addEventListener('glitchIntensityChange', handleGlitchChange)
    return () => window.removeEventListener('glitchIntensityChange', handleGlitchChange)
  }, [])

  // Controles para ajustar parámetros en tiempo real
  const props = useControls({
    // Controles de cámara/enfoque
    focus: { value: 5.41, min: 1, max: 20, step: 0.01 },
    aperture: { value: 1.5, min: 0.1, max: 5.6, step: 0.1 },
    fov: { value: 20, min: 10, max: 100, step: 1 },

    // Controles de animación
    speed: { value: 0.01, min: 0, max: 1, step: 0.01 },

    // Controles de viento
    windX: { value: -1.0, min: -2, max: 2, step: 0.01 },
    windY: { value: 0.0, min: -2, max: 2, step: 0.01 },
    windSpeed: { value: 0.63, min: 0, max: 2, step: 0.01 },
    windOsc: { value: 1.00, min: 0, max: 5, step: 0.01 },

    // Controles de caída
    fallSpeed: { value: 0.97, min: 0, max: 2, step: 0.01 },

    // Controles de tamaño
    sizeMode: { value: 'random', options: ['fixed', 'random'] },
    sizeFixed: { value: 2.6, min: 0.1, max: 10, step: 0.1 },
    sizeMin: { value: 1.9, min: 0.1, max: 10, step: 0.1 },
    sizeMax: { value: 1.0, min: 0.1, max: 10, step: 0.1 },

    // Controles de atracción del mouse
    attractionRadius: { value: 1.0, min: 0.1, max: 5, step: 0.1 },
    attractionStrength: { value: 0.8, min: 0, max: 2, step: 0.1 },
    vortexStrength: { value: 1.5, min: 0, max: 5, step: 0.1 },
    vortexSpeed: { value: 1.0, min: 0, max: 5, step: 0.1 },
    vortexColor: { value: '#ff6600' },
    vortexIntensity: { value: 3.0, min: 0, max: 10, step: 0.1 },

    // Controles de brillo/glow
    glowIntensity: { value: 3.5, min: 0, max: 10, step: 0.1 },
    glowSize: { value: 2.5, min: 1, max: 5, step: 0.1 },

    // Controles de brillo central
    centerGlowRadius: { value: 3.0, min: 0.5, max: 10, step: 0.1 },
    centerGlowIntensity: { value: 2.0, min: 0, max: 5, step: 0.1 }
  })

  return (
    <>
      <OrbitControls
        makeDefault
        enableRotate={false}
        enablePan={false}
        enableZoom={false}
        mouseButtons={{
          LEFT: null,
          MIDDLE: null,
          RIGHT: null
        }}
      />

      <Particles {...props} speed={dynamicSpeed} />
    </>
  )
}
