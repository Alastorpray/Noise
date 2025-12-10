class AudioManager {
  constructor() {
    this.audioContext = null
    this.analyser = null
    this.audioBuffer = null
    this.source = null
    this.gainNode = null
    this.dataArray = null
    this.bufferLength = 0
    this.isPlaying = false
    this.fadeInterval = null
    this.isTransitioning = false

    // === Normalización dinámica ===
    // Valores históricos para calcular min/max del audio actual
    this.bassHistory = []
    this.midHistory = []
    this.trebleHistory = []
    this.historySize = 120 // ~2 segundos a 60fps

    // Rangos dinámicos - null hasta que se calibren con el audio real
    this.bassMin = null
    this.bassMax = null
    this.midMin = null
    this.midMax = null
    this.trebleMin = null
    this.trebleMax = null

    // Parámetros de adaptación
    this.adaptationSpeed = 0.02 // Qué tan rápido se adaptan los rangos
    this.minRange = 0.05 // Rango mínimo para evitar división por cero
  }

  async init(audioPath) {
    try {
      console.log('🎵 Initializing audio from:', audioPath)

      // Crear AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      console.log('✅ AudioContext created:', this.audioContext.state)

      // Crear nodos
      this.analyser = this.audioContext.createAnalyser()
      this.gainNode = this.audioContext.createGain()

      // Configurar analyser
      this.analyser.fftSize = 256
      this.bufferLength = this.analyser.frequencyBinCount
      this.dataArray = new Uint8Array(this.bufferLength)

      // Cargar audio
      console.log('📥 Fetching audio file...')
      const response = await fetch(audioPath)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log('✅ Audio file fetched, decoding...')
      const arrayBuffer = await response.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      console.log('✅ Audio initialized successfully! Duration:', this.audioBuffer.duration, 'seconds')

      // Resetear normalización para el nuevo audio
      this.resetNormalization()

      return true
    } catch (error) {
      console.error('❌ Error initializing audio:', error)
      return false
    }
  }

  async resumeContext() {
    if (!this.audioContext) {
      console.warn('⚠️ AudioContext not initialized')
      return false
    }

    if (this.audioContext.state === 'suspended') {
      console.log('🔓 Resuming AudioContext...')
      try {
        await this.audioContext.resume()
        console.log('✅ AudioContext resumed:', this.audioContext.state)
        return true
      } catch (error) {
        console.error('❌ Error resuming AudioContext:', error)
        return false
      }
    }

    console.log('✅ AudioContext already running:', this.audioContext.state)
    return true
  }

  async play() {
    if (!this.audioContext || !this.audioBuffer) {
      console.warn('⚠️ Audio not initialized')
      return
    }

    // Si ya está reproduciendo o en transición, no hacer nada
    if (this.isPlaying || this.isTransitioning) {
      console.log('🎵 Audio already playing or transitioning')
      return
    }

    this.isTransitioning = true

    try {
      console.log('▶️ Starting audio playback...')

      // Esperar a que el contexto se reanude (IMPORTANTE: await)
      if (this.audioContext.state === 'suspended') {
        console.log('🔄 Resuming suspended AudioContext...')
        await this.audioContext.resume()
        console.log('✅ AudioContext resumed:', this.audioContext.state)
      }

      // Crear nueva fuente (las fuentes solo se pueden usar una vez)
      this.source = this.audioContext.createBufferSource()
      this.source.buffer = this.audioBuffer
      this.source.loop = true

      // Conectar: source → gain → analyser → destination
      this.source.connect(this.gainNode)
      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)

      // Fade in
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5)

      // Iniciar reproducción
      this.source.start(0)
      this.isPlaying = true
      console.log('✅ Audio playing! Volume fading in...')
    } catch (error) {
      console.error('❌ Error playing audio:', error)
      this.isPlaying = false
    } finally {
      this.isTransitioning = false
    }
  }

  pause() {
    if (!this.isPlaying || !this.audioContext) return

    console.log('⏸️ Pausing audio...')

    // Fade out rápido
    const currentTime = this.audioContext.currentTime
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime)
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.3)

    // Suspender contexto después del fade
    setTimeout(() => {
      if (this.audioContext && this.audioContext.state === 'running') {
        this.audioContext.suspend()
        console.log('⏸️ Audio paused (context suspended)')
      }
    }, 300)

    // Actualizar estado inmediatamente para evitar race conditions
    // Nota: isPlaying sigue siendo true porque el audio está pausado, no detenido
  }

  async resume() {
    if (!this.audioContext) return

    // Si no está en estado suspended, no hacer nada
    if (this.audioContext.state !== 'suspended') {
      console.log('⏭️ AudioContext not suspended, state:', this.audioContext.state)
      return
    }

    console.log('▶️ Resuming audio...')

    try {
      // Reanudar contexto
      await this.audioContext.resume()

      // Fade in solo si aún está reproduciendo
      if (this.isPlaying && this.gainNode) {
        const currentTime = this.audioContext.currentTime
        this.gainNode.gain.setValueAtTime(0, currentTime)
        this.gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.3)
      }

      console.log('▶️ Audio resumed')
    } catch (error) {
      console.error('❌ Error resuming audio:', error)
    }
  }

  stop() {
    if (!this.isPlaying) return

    console.log('⏹️ Stopping audio... Fading out...')

    // Actualizar estado inmediatamente
    this.isPlaying = false

    // Fade out
    if (this.audioContext && this.gainNode) {
      const currentTime = this.audioContext.currentTime
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime)
      this.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.5)
    }

    // Detener después del fade out
    setTimeout(() => {
      if (this.source) {
        try {
          this.source.stop()
          this.source.disconnect()
        } catch (e) {
          console.warn('⚠️ Error stopping source:', e.message)
        }
        this.source = null
      }
      console.log('⏹️ Audio stopped')
    }, 500)
  }

  // Normalizar un valor al rango 0-1 basado en min/max dinámicos
  normalize(value, min, max) {
    // Si aún no hay calibración, usar el valor raw amplificado
    if (min === null || max === null) {
      return Math.min(value * 3, 1) // Amplificar temporalmente
    }
    const range = Math.max(max - min, this.minRange)
    const normalized = (value - min) / range
    // Clamp entre 0 y 1
    return Math.max(0, Math.min(1, normalized))
  }

  // Actualizar rangos dinámicos basados en el historial
  updateDynamicRanges() {
    if (this.bassHistory.length < 20) return // Esperar datos suficientes

    // Calcular percentiles para evitar outliers
    const getPercentile = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b)
      const idx = Math.floor(sorted.length * p)
      return sorted[idx]
    }

    // Usar percentil 5 para min y 95 para max (evita outliers)
    const newBassMin = getPercentile(this.bassHistory, 0.05)
    const newBassMax = getPercentile(this.bassHistory, 0.95)
    const newMidMin = getPercentile(this.midHistory, 0.05)
    const newMidMax = getPercentile(this.midHistory, 0.95)
    const newTrebleMin = getPercentile(this.trebleHistory, 0.05)
    const newTrebleMax = getPercentile(this.trebleHistory, 0.95)

    // Si es la primera calibración, usar valores directamente
    if (this.bassMin === null) {
      this.bassMin = newBassMin
      this.bassMax = newBassMax
      this.midMin = newMidMin
      this.midMax = newMidMax
      this.trebleMin = newTrebleMin
      this.trebleMax = newTrebleMax
      console.log('🎚️ Initial calibration:', {
        bass: [this.bassMin.toFixed(3), this.bassMax.toFixed(3)],
        mid: [this.midMin.toFixed(3), this.midMax.toFixed(3)],
        treble: [this.trebleMin.toFixed(3), this.trebleMax.toFixed(3)]
      })
      return
    }

    // Suavizar la adaptación (exponential moving average)
    const speed = this.adaptationSpeed
    this.bassMin += (newBassMin - this.bassMin) * speed
    this.bassMax += (newBassMax - this.bassMax) * speed
    this.midMin += (newMidMin - this.midMin) * speed
    this.midMax += (newMidMax - this.midMax) * speed
    this.trebleMin += (newTrebleMin - this.trebleMin) * speed
    this.trebleMax += (newTrebleMax - this.trebleMax) * speed
  }

  // Resetear historial cuando cambia el audio
  resetNormalization() {
    this.bassHistory = []
    this.midHistory = []
    this.trebleHistory = []
    // Empezar con null para forzar calibración desde los datos reales
    this.bassMin = null
    this.bassMax = null
    this.midMin = null
    this.midMax = null
    this.trebleMin = null
    this.trebleMax = null
    console.log('🔄 Normalization reset - will calibrate to new audio')
  }

  getAudioData() {
    if (!this.analyser || !this.isPlaying) {
      return {
        amplitude: 0,
        frequencies: new Uint8Array(0),
        bass: 0,
        mid: 0,
        treble: 0,
        // También devolver valores raw para debug
        rawBass: 0,
        rawMid: 0,
        rawTreble: 0
      }
    }

    // Obtener datos de frecuencia
    this.analyser.getByteFrequencyData(this.dataArray)

    // Calcular amplitude promedio (0-1)
    const sum = this.dataArray.reduce((acc, val) => acc + val, 0)
    const amplitude = sum / (this.bufferLength * 255)

    // Separar por rangos de frecuencia
    const third = Math.floor(this.bufferLength / 3)

    const bassSum = this.dataArray.slice(0, third).reduce((a, b) => a + b, 0)
    const rawBass = bassSum / (third * 255)

    const midSum = this.dataArray.slice(third, third * 2).reduce((a, b) => a + b, 0)
    const rawMid = midSum / (third * 255)

    const trebleSum = this.dataArray.slice(third * 2).reduce((a, b) => a + b, 0)
    const rawTreble = trebleSum / (third * 255)

    // === Agregar al historial ===
    this.bassHistory.push(rawBass)
    this.midHistory.push(rawMid)
    this.trebleHistory.push(rawTreble)

    // Mantener tamaño del historial
    if (this.bassHistory.length > this.historySize) {
      this.bassHistory.shift()
      this.midHistory.shift()
      this.trebleHistory.shift()
    }

    // Actualizar rangos dinámicos
    this.updateDynamicRanges()

    // === Normalizar valores ===
    const bass = this.normalize(rawBass, this.bassMin, this.bassMax)
    const mid = this.normalize(rawMid, this.midMin, this.midMax)
    const treble = this.normalize(rawTreble, this.trebleMin, this.trebleMax)

    return {
      amplitude,
      frequencies: this.dataArray,
      bass,
      mid,
      treble,
      // Valores raw para debug
      rawBass,
      rawMid,
      rawTreble
    }
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    }
  }

  dispose() {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

// Exportar instancia única (singleton)
export const audioManager = new AudioManager()