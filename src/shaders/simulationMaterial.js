import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import glsl from 'babel-plugin-glsl/macro'

function getPoint(v, size, data, offset) {
  v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
  if (v.length() > 1) return getPoint(v, size, data, offset)
  return v.normalize().multiplyScalar(size).toArray(data, offset)
}

function getSphere(count, size, p = new THREE.Vector4()) {
  const data = new Float32Array(count * 4)
  for (let i = 0; i < count * 4; i += 4) getPoint(p, size, data, i)
  return data
}

class SimulationMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: `varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
      fragmentShader: glsl`uniform float uTime;
      uniform vec2 uWindDir;
      uniform float uWindSpeed;
      uniform float uFallSpeed;
      uniform float uWindOsc;
      uniform vec3 uMousePos;
      uniform float uMouseActive;
      varying vec2 vUv;
      float hash(vec2 p){
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }
      void main() {
        float t = uTime;
        vec2 uv = vUv;
        vec2 n = vec2(hash(uv), hash(uv.yx));
        vec2 wind = normalize(uWindDir) * uWindSpeed * sin(t * uWindOsc);
        float h = 1.0 - fract(t * uFallSpeed + n.x);
        float x = (uv.x - 0.5) * 20.0 + wind.x + (n.x - 0.5) * 2.0;
        float y = (uv.y - 0.5) * 12.0 + wind.y + (sin(t * 1.7 + n.y * 6.0) * 0.5);
        float z = h * 20.0;
        vec3 pos = vec3(x, y, z);

        // Atracción al mouse
        if (uMouseActive > 0.5) {
          vec3 toMouse = uMousePos - pos;
          float dist = length(toMouse);
          float attractionRadius = 1.0;
          if (dist < attractionRadius) {
            float strength = (1.0 - dist / attractionRadius) * 0.8;
            pos += toMouse * strength;
          }
        }

        gl_FragColor = vec4(pos, 1.0);
      }`,
      uniforms: {
        uTime: { value: 0 },
        uWindDir: { value: new THREE.Vector2(1, 0) },
        uWindSpeed: { value: 0.5 },
        uFallSpeed: { value: 0.4 },
        uWindOsc: { value: 1.0 },
        uMousePos: { value: new THREE.Vector3(0, 0, 0) },
        uMouseActive: { value: 0.0 }
      }
    })
  }
}

extend({ SimulationMaterial })
