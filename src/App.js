import { OrbitControls } from '@react-three/drei'
import { Particles } from './Particles'

export default function App() {
  // Parámetros hardcodeados según image.png
  const props = {
    focus: 5.41,
    speed: 0.01,
    aperture: 1.5,
    fov: 20,
    windX: -1.0,
    windY: 0.0,
    windSpeed: 0.63,
    fallSpeed: 0.97,
    windOsc: 1.00,
    sizeMode: 'random',
    sizeFixed: 2.6,
    sizeMin: 1.9,
    sizeMax: 1.0
  }

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

      <Particles {...props} />
    </>
  )
}
