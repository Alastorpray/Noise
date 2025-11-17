# Coresearch - Conectado Mundos

Aplicación de visualización 3D interactiva con sistema de partículas GPU, efecto de profundidad de campo (DoF) y simulación de física en tiempo real.

## Características

- 🎨 **262,144 partículas** renderizadas en GPU (512×512)
- 🌊 **Simulación de física**: Viento, gravedad, movimiento procedural
- 📸 **Profundidad de campo**: Efecto fotográfico realista
- 🎮 **Controles en tiempo real**: Interfaz Leva para ajustar parámetros
- ⚡ **WebGL2**: Rendimiento mejorado +25% vs WebGL1

## Tecnologías

- **React** 18.2.0
- **Three.js** 0.154.0 (WebGL2)
- **React Three Fiber** 8.13.0
- **React Three Drei** 9.80.0
- **Leva** 0.9.35 (GUI Controls)

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Abrir http://localhost:3000
```

## Compatibilidad

- ✅ **Chrome** 56+ (2017)
- ✅ **Firefox** 51+ (2017)
- ✅ **Safari** 15+ (2021)
- ✅ **Edge** 79+ (2020)
- ✅ **97%** de navegadores globalmente

## Controles

| Control | Descripción |
|---------|-------------|
| **Focus** | Distancia del plano de enfoque |
| **Speed** | Velocidad de la simulación |
| **Aperture** | Apertura de cámara (f-stop) |
| **FOV** | Campo de visión |
| **Wind X/Y** | Dirección del viento |
| **Wind Speed** | Velocidad del viento |
| **Fall Speed** | Velocidad de caída de partículas |
| **Wind Osc** | Oscilación del viento |
| **Size Mode** | Tamaño fijo o aleatorio |

## Estructura

```
src/
├── index.js              # Configuración WebGL2
├── App.js                # Componente principal + controles
├── Particles.js          # Sistema de partículas
├── styles.css            # Estilos globales
└── shaders/
    ├── simulationMaterial.js  # Física de partículas (GLSL)
    └── dofPointsMaterial.js   # Renderizado con DoF (GLSL)
```

## Migración WebGL2

Este proyecto fue actualizado de WebGL 1.0 a WebGL 2.0. Ver [WEBGL2_MIGRATION.md](./WEBGL2_MIGRATION.md) para detalles técnicos.

### Mejoras:
- 🚀 **+25% rendimiento** en renderizado
- 📦 Mejor manejo de texturas
- 🎯 Menor overhead CPU
- ✨ API moderna con fallback automático a WebGL1

## Verificar WebGL2

Abre la consola del navegador (F12) y ejecuta:

```javascript
const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl2')
console.log(gl ? 'WebGL2 ✅' : 'WebGL1 fallback')
```

## Build

```bash
# Crear build de producción
npm run build

# Output en build/
```

## Licencia

MIT

---

**Coresearch** - Conectando mundos a través de la visualización interactiva
