import React, { useState, useEffect, useRef } from 'react'
import './landing.css'
import { audioManager } from './audioManager'

export function LandingPage() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const inactivityTimer = useRef(null)
  const [form, setForm] = useState({ nombre: '', email: '', empresa: '', mensaje: '' })
  const [formStatus, setFormStatus] = useState('idle')
  const [expandedDivision, setExpandedDivision] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [glitchIntensity, setGlitchIntensity] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const logoTextRef = useRef(null)
  const isTouchActive = useRef(false)
  const [audioData, setAudioData] = useState({ amplitude: 0, bass: 0, mid: 0, treble: 0 })
  const [hoverDuration, setHoverDuration] = useState(0)
  const audioAnimationFrame = useRef(null)
  const hoverStartTime = useRef(0)
  const audioInitialized = useRef(false)

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleCollapse = () => {
    setIsClosing(true)
    // Resetear el glitch inmediatamente
    setIsHovering(false)
    setGlitchIntensity(0)
    setTimeout(() => {
      setIsExpanded(false)
      setIsClosing(false)
    }, 800) // Duración de la animación de colapso
  }

  const resetTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    if (isExpanded && !isClosing) {
      inactivityTimer.current = setTimeout(() => {
        handleCollapse()
      }, 30000) // 30 segundos
    }
  }

  useEffect(() => {
    const handleActivity = () => {
      if (!isClosing) {
        resetTimer()
      }
    }

    // Detectar actividad
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('click', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('click', handleActivity)
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
    }
  }, [isExpanded, isClosing])

  useEffect(() => {
    resetTimer()
  }, [isExpanded])

  const handleImageClick = () => {
    // Detener el audio completamente (no solo pausar)
    audioManager.stop()
    setIsHovering(false)
    setGlitchIntensity(0)
    setIsExpanded(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.mensaje) return
    setFormStatus('sending')
    setTimeout(() => {
      setFormStatus('success')
      setForm({ nombre: '', email: '', empresa: '', mensaje: '' })
    }, 600)
  }

  const onNavClick = (e, selector) => {
    e.preventDefault()
    const el = document.querySelector(selector)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleDivision = (key) => {
    setExpandedDivision((prev) => (prev === key ? null : key))
  }

  const handleLogoMouseEnter = () => {
    // Activar hover INMEDIATAMENTE (no esperar al audio)
    setIsHovering(true)

    // Activar AudioContext en background (sincrónico con user gesture)
    if (audioInitialized.current) {
      audioManager.resumeContext()
    }
  }

  const handleLogoMouseLeave = () => {
    setIsHovering(false)
  }

  const checkTouchOverLogo = (clientX, clientY) => {
    if (!logoTextRef.current) return false
    const rect = logoTextRef.current.getBoundingClientRect()
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    )
  }

  const handleLogoTouchStart = (e) => {
    // Activar AudioContext en background (sincrónico con user gesture)
    if (audioInitialized.current) {
      audioManager.resumeContext()
    }

    isTouchActive.current = true
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      const isOver = checkTouchOverLogo(touch.clientX, touch.clientY)
      setIsHovering(isOver)
    }
  }

  const handleLogoTouchEnd = () => {
    isTouchActive.current = false
    setIsHovering(false)
  }

  // Glitch controlado por audio (en el loop de captura de audio)

  // Emitir evento cuando cambie glitchIntensity
  useEffect(() => {
    const event = new CustomEvent('glitchIntensityChange', { detail: glitchIntensity })
    window.dispatchEvent(event)
  }, [glitchIntensity])

  // Inicializar audio manager
  useEffect(() => {
    const initAudio = async () => {
      const success = await audioManager.init('/sfx/medusa.mp3')
      if (success) {
        audioInitialized.current = true
      }
    }
    initAudio()

    return () => {
      audioManager.dispose()
    }
  }, [])

  // Manejar reproducción de audio y captura de datos
  useEffect(() => {
    if (!audioInitialized.current) return

    if (isHovering) {
      // Si el audio está pausado, resumir. Si no, iniciar desde el principio
      if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        audioManager.resume()
      } else if (!audioManager.isPlaying) {
        audioManager.play()
      }

      if (!hoverStartTime.current) {
        hoverStartTime.current = Date.now()
      }

      // Loop de captura de audio data
      const captureAudioData = () => {
        const data = audioManager.getAudioData()
        setAudioData(data)

        // Calcular glitch intensity basado en audio
        const bassWeight = 1.0
        const midWeight = 0.6
        const trebleWeight = 0.4
        const audioIntensity = (data.bass * bassWeight) + (data.mid * midWeight) + (data.treble * trebleWeight)

        // Aplicar suavizado para evitar cambios bruscos
        setGlitchIntensity(prev => {
          const target = Math.min(audioIntensity * 1.2, 1)
          const smoothing = 0.15
          return prev + (target - prev) * smoothing
        })

        // Calcular duración del hover (0-1, max 5 segundos)
        const duration = Math.min((Date.now() - hoverStartTime.current) / 5000, 1)
        setHoverDuration(duration)

        audioAnimationFrame.current = requestAnimationFrame(captureAudioData)
      }

      captureAudioData()
    } else {
      // Solo pausar el audio (mantiene la posición)
      audioManager.pause()
      setHoverDuration(0)

      // Decay suave del glitch cuando se quita el hover
      const decayGlitch = () => {
        setGlitchIntensity(prev => {
          const newValue = prev * 0.92
          if (newValue < 0.01) return 0
          audioAnimationFrame.current = requestAnimationFrame(decayGlitch)
          return newValue
        })
      }
      decayGlitch()
    }

    return () => {
      if (audioAnimationFrame.current) {
        cancelAnimationFrame(audioAnimationFrame.current)
      }
    }
  }, [isHovering])

  // Emitir evento cuando cambien los datos de audio
  useEffect(() => {
    const event = new CustomEvent('audioDataChange', {
      detail: {
        amplitude: audioData.amplitude,
        bass: audioData.bass,
        mid: audioData.mid,
        treble: audioData.treble,
        hoverDuration: hoverDuration
      }
    })
    window.dispatchEvent(event)
  }, [audioData, hoverDuration])

  // Detectar cuando el dedo se mueve sobre el logo mientras está presionado
  useEffect(() => {
    const handleGlobalTouchMove = (e) => {
      if (!isTouchActive.current || !logoTextRef.current) return

      if (e.touches.length > 0) {
        const touch = e.touches[0]
        const isOver = checkTouchOverLogo(touch.clientX, touch.clientY)
        setIsHovering(isOver)
      }
    }

    const handleGlobalTouchStart = () => {
      isTouchActive.current = true
    }

    const handleGlobalTouchEnd = () => {
      isTouchActive.current = false
      setIsHovering(false)
    }

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true })
    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true })
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove)
      window.removeEventListener('touchstart', handleGlobalTouchStart)
      window.removeEventListener('touchend', handleGlobalTouchEnd)
      window.removeEventListener('touchcancel', handleGlobalTouchEnd)
    }
  }, [])

  return (
    <div className="landing-container">
      {/* Texto central */}
      {!isExpanded && !isClosing && (
        <div className="logo-container" onClick={handleImageClick}>
          <div
            ref={logoTextRef}
            className="logo-text"
            onMouseEnter={handleLogoMouseEnter}
            onMouseLeave={handleLogoMouseLeave}
            onTouchStart={handleLogoTouchStart}
            onTouchEnd={handleLogoTouchEnd}
            style={{
              '--glitch-intensity': glitchIntensity,
              '--mid-intensity': audioData.mid
            }}
          >
            <div
              className="logo-main"
              data-text="CORE"
              style={{ color: isHovering ? '#ff6600' : '#ffffff' }}
            >
              CORE
            </div>
            <div
              className="logo-sub"
              data-text="Research"
              style={{ color: isHovering ? '#ffffff' : '#ffffff' }}
            >
              Research
            </div>
          </div>
        </div>
      )}

      {/* Contenido expandido */}
      {(isExpanded || isClosing) && (
        <div className={`page-content ${isClosing ? 'collapsed' : 'expanded'} theme-${theme}`}>
          {/* Navigation */}
          <nav className="main-nav">
            <div className="nav-content">
              <div className="nav-brand">
                <div className="nav-logo">CORE</div>
                <div className="nav-tagline">Research</div>
              </div>
              <div className="nav-links">
                <a href="#about" className="nav-link" onClick={(e) => onNavClick(e, '#about')}>About</a>
                <a href="#portfolio" className="nav-link" onClick={(e) => onNavClick(e, '#portfolio')}>Portfolio</a>
                <a href="#contact" className="nav-link" onClick={(e) => onNavClick(e, '#contact')}>Contact</a>
                <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <h1 className="hero-title">Connecting worlds</h1>
              <p className="hero-subtitle">
                We transform ideas into innovative digital experiences that connect people,
                technologies and new possibilities.
              </p>
            </div>
          </section>

          {/* About Section */}
          <section className="section" id="about">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item">
                  <h2 className="section-heading">Who We Are</h2>
                </div>
                <div className="grid-item">
                  <p className="body-text">
                    Multidisciplinary team specialized in applied research and digital solution development.
                    We design and validate technologies with real business impact.
                  </p>
                  <p className="body-text">
                    We combine rapid prototyping, controlled experimentation and transfer to production
                    to shorten the path from idea to results.
                  </p>
                </div>
              </div>
            </div>
          </section>


          <section className="section" id="divisions">
            <div className="section-wrapper">
              <h2 className="section-heading-center">Divisions</h2>
              <div className="divisions-grid">
                <div className="division-card" onClick={() => toggleDivision('educational')}>
                  <h3 className="division-title">Educational</h3>
                  <p className="division-desc">Training and advisory in 3D development and XR experiences.</p>
                  {expandedDivision === 'educational' && (
                    <div className="flow flow-panel flow-visible">
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Sessions</h4><p>Curricula tailored for teams and universities.</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>XR Advisory</h4><p>Design reviews, interaction models and prototyping.</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Partnerships</h4><p>Academic and industry collaborations.</p></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="division-card" onClick={() => toggleDivision('3dprint')}>
                  <h3 className="division-title">3D print development</h3>
                  <p className="division-desc">Development for additive manufacturing, prototyping and 3D print workflows.</p>
                  {expandedDivision === '3dprint' && (
                    <div className="flow flow-panel flow-visible">
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Prototypes</h4><p>Functional iterations and fit‑for‑purpose parts.</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Materials</h4><p>PLA, PETG, ABS, resins and composites workflows.</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Integration</h4><p>Printers, slicers and QC pipelines.</p></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="division-card" onClick={() => toggleDivision('xr')}>
                  <h3 className="division-title">XR development</h3>
                  <p className="division-desc">XR simulators and applications with Unity and Meta Quest 2/3.</p>
                  {expandedDivision === 'xr' && (
                    <div className="flow flow-panel flow-visible">
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Simulators</h4><p>Task training and procedural environments.</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Platforms</h4><p>Meta Quest 2/3 and desktop XR targets.</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>Performance</h4><p>Frame‑rate goals and interaction fidelity.</p></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>


          

          {/* CTA Section */}
          <section className="section" id="contact">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item contact-side">
                  <h2 className="contact-heading">Let's talk.</h2>
                  <p className="contact-tagline">Partner with Coresearch to build your next XR project.</p>
                  <ul className="contact-feature-list">
                    <li className="feature-item">End‑to‑End Delivery</li>
                    <li className="feature-item">Startup Speed</li>
                    <li className="feature-item">World‑Class Team</li>
                  </ul>
                </div>
                <div className="grid-item">
                  <div className="contact-card">
                    <h3 className="contact-title">Ready to build XR?</h3>
                    <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="input-row">
                      <div className="input-group">
                        <label htmlFor="nombre">Name</label>
                        <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} required />
                      </div>
                      <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="empresa">Company (optional)</label>
                      <input id="empresa" name="empresa" type="text" value={form.empresa} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label htmlFor="mensaje">Message</label>
                      <textarea id="mensaje" name="mensaje" rows="4" value={form.mensaje} onChange={handleChange} required />
                    </div>
                    <div className="form-actions">
                      <button className="contact-submit" type="submit" disabled={formStatus === 'sending'}>
                        {formStatus === 'sending' ? 'Sending…' : 'Send'}
                      </button>
                      {formStatus === 'success' && <span className="form-success">Thanks, we’ll contact you soon.</span>}
                    </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <div className="footer-content">
              <p className="footer-text">© 2024 Coresearch. Connecting worlds.</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}
