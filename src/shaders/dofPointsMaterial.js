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
      uniform float uAttractionRadius;
      uniform float uGlowSize;
      uniform float uCenterGlowRadius;
      varying float vDistance;
      varying float vMouseDist;
      varying float vCenterDist;
      void main() {
        vec3 pos = texture2D(positions, position.xy).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vDistance = abs(uFocus - -mvPosition.z);

        // Calcular distancia al mouse y al centro
        vMouseDist = distance(pos, uMousePos);
        vCenterDist = length(pos);

        float r = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float sizeFactor = uSizeMode == 1 ? mix(uSizeMin, uSizeMax, r) : uSizeFixed;

        // Aumentar tamaño si está cerca del mouse (efecto glow)
        if (uMouseActive > 0.5 && vMouseDist < uAttractionRadius) {
          float glowFactor = 1.0 - (vMouseDist / uAttractionRadius);
          sizeFactor *= (1.0 + glowFactor * uGlowSize);
        }

        // Aumentar tamaño si está cerca del centro
        if (vCenterDist < uCenterGlowRadius) {
          float centerGlowFactor = 1.0 - (vCenterDist / uCenterGlowRadius);
          sizeFactor *= (1.0 + centerGlowFactor * uGlowSize * 0.5);
        }

        gl_PointSize = sizeFactor;
      }`,
      fragmentShader: `uniform float uOpacity;
      uniform float uMouseActive;
      uniform float uAttractionRadius;
      uniform float uGlowIntensity;
      uniform vec3 uVortexColor;
      uniform float uVortexIntensity;
      uniform float uCenterGlowRadius;
      uniform float uCenterGlowIntensity;
      varying float vDistance;
      varying float vMouseDist;
      varying float vCenterDist;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float dist = length(cxy);

        vec3 color = vec3(1.0);
        float alpha = (1.04 - clamp(vDistance * 1.5, 0.0, 1.0));
        bool isGlowing = false;

        // Efecto glow para partículas cerca del centro
        if (vCenterDist < uCenterGlowRadius) {
          float centerMixFactor = 1.0 - (vCenterDist / uCenterGlowRadius);
          centerMixFactor = pow(centerMixFactor, 0.5);

          // Glow con gradiente radial suave
          float glow = 1.0 - smoothstep(0.0, 1.0, dist);
          glow = pow(glow, 0.8);

          // Intensificar el brillo del centro
          color *= mix(1.0, uCenterGlowIntensity, centerMixFactor);
          alpha *= glow;

          // Añadir brillo extra en el centro de cada partícula
          float core = 1.0 - smoothstep(0.0, 0.3, dist);
          color += vec3(1.0) * core * centerMixFactor;
          isGlowing = true;
        }

        // Efecto glow para partículas cerca del mouse (vórtex)
        if (uMouseActive > 0.5 && vMouseDist < uAttractionRadius) {
          float mixFactor = 1.0 - (vMouseDist / uAttractionRadius);
          mixFactor = pow(mixFactor, 0.5);

          // Color del vórtex personalizable
          color = mix(color, uVortexColor, mixFactor * 0.8);

          // Glow con gradiente radial suave
          float glow = 1.0 - smoothstep(0.0, 1.0, dist);
          glow = pow(glow, 0.8);

          // Intensificar el brillo con intensidad personalizada
          color *= mix(1.0, uVortexIntensity, mixFactor);
          alpha *= glow;

          // Añadir brillo extra en el centro con el color del vórtex
          float core = 1.0 - smoothstep(0.0, 0.3, dist);
          color += uVortexColor * core * mixFactor * 2.0;
          isGlowing = true;
        }

        if (!isGlowing) {
          // Partículas normales con bordes suaves
          if (dist > 1.0) discard;
          float edge = 1.0 - smoothstep(0.7, 1.0, dist);
          alpha *= edge;
          color *= 0.3; // Partículas normales más tenues para que el glow destaque
        }

        gl_FragColor = vec4(color, alpha);
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
        uMouseActive: { value: 0.0 },
        uAttractionRadius: { value: 1.0 },
        uVortexColor: { value: new THREE.Vector3(1.0, 0.4, 0.0) },
        uVortexIntensity: { value: 3.0 },
        uGlowIntensity: { value: 2.0 },
        uGlowSize: { value: 1.5 },
        uCenterGlowRadius: { value: 3.0 },
        uCenterGlowIntensity: { value: 2.0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }
}

extend({ DofPointsMaterial })
