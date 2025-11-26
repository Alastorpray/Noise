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

    // Si ya está reproduciendo, no hacer nada
    if (this.isPlaying) {
      console.log('🎵 Audio already playing')
      return
    }

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
  }

  stop() {
    if (!this.isPlaying || !this.source) return

    console.log('⏸️ Stopping audio... Fading out...')

    // Fade out
    const currentTime = this.audioContext.currentTime
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime)
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.5)

    // Detener después del fade out
    setTimeout(() => {
      if (this.source) {
        try {
          this.source.stop()
        } catch (e) {
          // Source ya detenida
        }
        this.source = null
      }
      this.isPlaying = false
      console.log('⏹️ Audio stopped')
    }, 500)
  }

  getAudioData() {
    if (!this.analyser || !this.isPlaying) {
      return {
        amplitude: 0,
        frequencies: new Uint8Array(0),
        bass: 0,
        mid: 0,
        treble: 0
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
    const bass = bassSum / (third * 255)

    const midSum = this.dataArray.slice(third, third * 2).reduce((a, b) => a + b, 0)
    const mid = midSum / (third * 255)

    const trebleSum = this.dataArray.slice(third * 2).reduce((a, b) => a + b, 0)
    const treble = trebleSum / (third * 255)

    return {
      amplitude,
      frequencies: this.dataArray,
      bass,
      mid,
      treble
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