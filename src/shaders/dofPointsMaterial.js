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
      varying float vRotation;
      void main() {
        vec3 pos = texture2D(positions, position.xy).xyz;
        // Rotación aleatoria por partícula
        vRotation = fract(sin(dot(position.xy, vec2(45.233, 97.113))) * 43758.5453) * 6.28318;
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
      uniform int uShape;
      varying float vDistance;
      varying float vMouseDist;
      varying float vCenterDist;
      varying float vRotation;

      // Función para rotar un punto 2D
      vec2 rotate2D(vec2 p, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
      }

      // SDF para triángulo equilátero
      float sdTriangle(vec2 p) {
        const float k = sqrt(3.0);
        p.x = abs(p.x) - 0.5;
        p.y = p.y + 0.5 / k;
        if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
        p.x -= clamp(p.x, -1.0, 0.0);
        return -length(p) * sign(p.y);
      }

      // SDF para cuadrado
      float sdSquare(vec2 p) {
        vec2 d = abs(p) - vec2(0.5);
        return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
      }

      // SDF para línea (arista) - reducida 30%
      float sdLine(vec2 p) {
        return abs(p.y) - 0.035;
      }

      // SDF para círculo (wireframe)
      float sdCircle(vec2 p) {
        return length(p) - 0.6;
      }

      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;

        // Aplicar rotación aleatoria para formas no circulares
        vec2 rotatedCxy = rotate2D(cxy, vRotation);

        // Determinar forma: si uShape == 4 (mixed), elegir aleatoriamente
        // 0 = círculo, 1 = cuadrado, 2 = triángulo, 3 = línea, 4 = mixed
        int shapeToUse = uShape;
        if (uShape == 4) {
          // Usar vRotation para determinar la forma (ya es aleatorio por partícula)
          // Triángulo 35%, resto ~21.67% cada uno
          float shapeRand = fract(vRotation * 10.0);
          if (shapeRand < 0.217) {
            shapeToUse = 0; // Círculo ~22%
          } else if (shapeRand < 0.434) {
            shapeToUse = 1; // Cuadrado ~22%
          } else if (shapeRand < 0.784) {
            shapeToUse = 2; // Triángulo 35%
          } else {
            shapeToUse = 3; // Línea ~22%
          }
        }

        // Calcular distancia según la forma seleccionada
        float sdfDist; // Distancia SDF real para wireframe
        float strokeWidth = 0.15; // Grosor de la línea

        if (shapeToUse == 1) {
          // Cuadrado
          sdfDist = sdSquare(rotatedCxy);
        } else if (shapeToUse == 2) {
          // Triángulo - 35% más grande
          sdfDist = sdTriangle(rotatedCxy * 0.89);
        } else if (shapeToUse == 3) {
          // Línea (arista) - reducida 30% en longitud
          sdfDist = sdLine(rotatedCxy * 1.43);
        } else {
          // Círculo
          sdfDist = sdCircle(cxy);
        }

        // Todas las formas son wireframe
        float wireframe = 1.0 - smoothstep(0.0, strokeWidth, abs(sdfDist));

        vec3 color = vec3(1.0);
        float alpha = (1.04 - clamp(vDistance * 1.5, 0.0, 1.0));
        bool isGlowing = false;

        // Efecto glow para partículas cerca del centro
        if (vCenterDist < uCenterGlowRadius) {
          float centerMixFactor = 1.0 - (vCenterDist / uCenterGlowRadius);
          centerMixFactor = pow(centerMixFactor, 0.5);

          alpha *= wireframe;
          color *= mix(1.0, uCenterGlowIntensity, centerMixFactor);
          isGlowing = true;
        }

        // Efecto glow para partículas cerca del mouse (vórtex)
        if (uMouseActive > 0.5 && vMouseDist < uAttractionRadius) {
          float mixFactor = 1.0 - (vMouseDist / uAttractionRadius);
          mixFactor = pow(mixFactor, 0.5);

          color = mix(color, uVortexColor, mixFactor * 0.8);
          alpha *= wireframe;
          color += uVortexColor * wireframe * mixFactor;
          color *= mix(1.0, uVortexIntensity, mixFactor);
          isGlowing = true;
        }

        if (!isGlowing) {
          if (wireframe < 0.01) discard;
          alpha *= wireframe;
          color *= 0.3;
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
        uCenterGlowIntensity: { value: 2.0 },
        uShape: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }
}

extend({ DofPointsMaterial })
