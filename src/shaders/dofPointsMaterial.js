import * as THREE from 'three'
import { extend } from '@react-three/fiber'

class DofPointsMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: `uniform sampler2D positions;
      uniform float uTime;
      uniform float uFocus;
      uniform float uFov;
      uniform float uBlur;
      uniform int uSizeMode;
      uniform float uSizeFixed;
      uniform float uSizeMin;
      uniform float uSizeMax;
      uniform vec3 uMousePos;
      uniform float uMouseActive;
      varying float vDistance;
      varying float vMouseDist;
      void main() {
        vec3 pos = texture2D(positions, position.xy).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vDistance = abs(uFocus - -mvPosition.z);

        // Calcular distancia al mouse
        vMouseDist = distance(pos, uMousePos);

        float r = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float sizeFactor = uSizeMode == 1 ? mix(uSizeMin, uSizeMax, r) : uSizeFixed;
        gl_PointSize = sizeFactor;
      }`,
      fragmentShader: `uniform float uOpacity;
      uniform float uMouseActive;
      varying float vDistance;
      varying float vMouseDist;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        if (dot(cxy, cxy) > 1.0) discard;

        vec3 color = vec3(1.0);
        float attractionRadius = 1.0;

        // Cambiar a naranja si está cerca del mouse
        if (uMouseActive > 0.5 && vMouseDist < attractionRadius) {
          float mixFactor = 1.0 - (vMouseDist / attractionRadius);
          vec3 orange = vec3(1.0, 0.5, 0.0);
          color = mix(vec3(1.0), orange, mixFactor);
        }

        gl_FragColor = vec4(color, (1.04 - clamp(vDistance * 1.5, 0.0, 1.0)));
      }`,
      uniforms: {
        positions: { value: null },
        uTime: { value: 0 },
        uFocus: { value: 5.1 },
        uFov: { value: 50 },
        uBlur: { value: 30 },
        uSizeMode: { value: 0 },
        uSizeFixed: { value: 3.0 },
        uSizeMin: { value: 1.0 },
        uSizeMax: { value: 5.0 },
        uMousePos: { value: new THREE.Vector3(0, 0, 0) },
        uMouseActive: { value: 0.0 }
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    })
  }
}

extend({ DofPointsMaterial })
