import { OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import { Particles } from './Particles'

export default function App() {
  const props = useControls({
    focus: { value: 5.1, min: 3, max: 7, step: 0.01 },
    speed: { value: 1.0, min: 0.0, max: 5.0, step: 0.01 },
    aperture: { value: 1.8, min: 1, max: 5.6, step: 0.1 },
    fov: { value: 20, min: 0, max: 200 },
    windX: { value: -1.0, min: -5, max: 5, step: 0.1 },
    windY: { value: 0.0, min: -5, max: 5, step: 0.1 },
    windSpeed: { value: 1.0, min: 0.0, max: 3.0, step: 0.01 },
    fallSpeed: { value: 0.4, min: 0.0, max: 2.0, step: 0.01 },
    windOsc: { value: 1.0, min: 0.1, max: 5.0, step: 0.01 },
    sizeMode: { value: 'fixed', options: ['fixed', 'random'] },
    sizeFixed: { value: 3.0, min: 1.0, max: 10.0, step: 0.1 },
    sizeMin: { value: 1.0, min: 0.5, max: 10.0, step: 0.1 },
    sizeMax: { value: 5.0, min: 1.0, max: 15.0, step: 0.1 }
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

      <Particles {...props} />
    </>
  )
}
