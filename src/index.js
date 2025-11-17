import * as THREE from 'three'
import { render, events, extend } from '@react-three/fiber'
import './styles.css'
import App from './App'

extend(THREE)

window.addEventListener('resize', () =>
  render(<App />, document.querySelector('canvas'), {
    events,
    linear: true,
    dpr: Math.min(window.devicePixelRatio, 2),
    camera: { fov: 25, position: [0, 0, 6] },
    gl: (canvas) => new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
  })
)

window.dispatchEvent(new Event('resize'))
