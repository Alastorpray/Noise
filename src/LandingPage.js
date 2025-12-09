import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './landing.css'
import { audioManager } from './audioManager'

export function LandingPage() {
  const { t, i18n } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const langMenuRef = useRef(null)

  // Cerrar menú de idioma al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setIsLangMenuOpen(false)
  }

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ]

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]
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
  // Beat detection refs
  const prevBass = useRef(0)
  const prevMid = useRef(0)
  const beatHold = useRef(0)
  const midBeatHold = useRef(0)
  const audioInitialized = useRef(false)
  const audioUnlocked = useRef(false)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleAudioToggle = () => {
    if (!audioEnabled && audioInitialized.current) {
      audioManager.resumeContext()
      audioUnlocked.current = true
    }
    setAudioEnabled(prev => !prev)
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
      const success = await audioManager.init('/sfx/tigerblood.mp3')
      if (success) {
        audioInitialized.current = true
      }
    }
    initAudio()

    return () => {
      audioManager.dispose()
    }
  }, [])

  // Detectar primer click/tap para desbloquear audio silenciosamente
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlocked.current && audioInitialized.current) {
        audioManager.resumeContext()
        audioUnlocked.current = true
        // Remover listeners después de desbloquear
        window.removeEventListener('click', unlockAudio)
        window.removeEventListener('touchstart', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
      }
    }

    window.addEventListener('click', unlockAudio)
    window.addEventListener('touchstart', unlockAudio)
    window.addEventListener('keydown', unlockAudio)

    return () => {
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  // Manejar reproducción de audio y captura de datos
  useEffect(() => {
    if (!audioInitialized.current) return

    if (isHovering && audioEnabled) {
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

        // === BEAT DETECTION para BASS (kicks) ===
        const bassThreshold = 0.08
        const bassDelta = data.bass - prevBass.current
        const isBassHit = bassDelta > bassThreshold && data.bass > 0.15

        if (isBassHit) {
          beatHold.current = Math.min(data.bass * 2.0, 1)
        } else {
          beatHold.current *= 0.88  // Decay rápido
        }
        prevBass.current = data.bass * 0.6 + prevBass.current * 0.4

        // === BEAT DETECTION para MIDS (snares) ===
        const midThreshold = 0.06
        const midDelta = data.mid - prevMid.current
        const isMidHit = midDelta > midThreshold && data.mid > 0.12

        if (isMidHit) {
          midBeatHold.current = Math.min(data.mid * 1.5, 0.8)
        } else {
          midBeatHold.current *= 0.9
        }
        prevMid.current = data.mid * 0.6 + prevMid.current * 0.4

        // === COMBINAR: beats + energía base ===
        const beatComponent = Math.max(beatHold.current, midBeatHold.current)
        const energyComponent = (data.bass * 0.5 + data.mid * 0.3 + data.treble * 0.2)
        const target = Math.max(beatComponent, energyComponent * 0.8)

        // Aplicar suavizado: attack rápido, release moderado
        setGlitchIntensity(prev => {
          const attack = 0.7   // Respuesta rápida a beats
          const release = 0.12  // Decay más lento
          const smoothing = target > prev ? attack : release
          return prev + (target - prev) * smoothing
        })

        // Calcular duración del hover (0-1, max 5 segundos)
        const duration = Math.min((Date.now() - hoverStartTime.current) / 5000, 1)
        setHoverDuration(duration)

        audioAnimationFrame.current = requestAnimationFrame(captureAudioData)
      }

      captureAudioData()
    } else if (!audioEnabled || !isHovering) {
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
  }, [isHovering, audioEnabled])

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
      {/* Audio Toggle Icon */}
      {!isExpanded && !isClosing && (
        <button
          className={`audio-toggle ${audioEnabled ? 'active' : ''} ${isHovering && audioEnabled ? 'playing' : ''}`}
          onClick={handleAudioToggle}
          aria-label={audioEnabled ? 'Disable sound' : 'Enable sound'}
        >
          <svg className="audio-waves" viewBox="0 0 32 16" fill="none">
            {/* Líneas verticales que forman una onda sinusoidal */}
            <line className="wave-line" x1="2" y1="8" x2="2" y2="10" />
            <line className="wave-line" x1="4" y1="6" x2="4" y2="12" />
            <line className="wave-line" x1="6" y1="4" x2="6" y2="14" />
            <line className="wave-line" x1="8" y1="3" x2="8" y2="15" />
            <line className="wave-line" x1="10" y1="4" x2="10" y2="14" />
            <line className="wave-line" x1="12" y1="6" x2="12" y2="12" />
            <line className="wave-line" x1="14" y1="7" x2="14" y2="11" />
            <line className="wave-line" x1="16" y1="5" x2="16" y2="13" />
            <line className="wave-line" x1="18" y1="3" x2="18" y2="15" />
            <line className="wave-line" x1="20" y1="2" x2="20" y2="16" />
            <line className="wave-line" x1="22" y1="3" x2="22" y2="15" />
            <line className="wave-line" x1="24" y1="5" x2="24" y2="13" />
            <line className="wave-line" x1="26" y1="6" x2="26" y2="12" />
            <line className="wave-line" x1="28" y1="7" x2="28" y2="11" />
            <line className="wave-line" x1="30" y1="7" x2="30" y2="11" />
          </svg>
        </button>
      )}

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
                <img src="/Coresearchlogo.svg" alt="Coresearch" className="nav-logo-img" />
                <div className="nav-brand-text">
                  <div className="nav-logo">CORE</div>
                  <div className="nav-tagline">Research</div>
                </div>
              </div>
              <div className="nav-links">
                <a href="#about" className="nav-link" onClick={(e) => onNavClick(e, '#about')}>{t('nav.about')}</a>
                <a href="#portfolio" className="nav-link" onClick={(e) => onNavClick(e, '#portfolio')}>{t('nav.portfolio')}</a>
                <a href="#contact" className="nav-link" onClick={(e) => onNavClick(e, '#contact')}>{t('nav.contact')}</a>
                
                <div className="lang-dropdown" ref={langMenuRef}>
                  <button 
                    className="lang-toggle" 
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    aria-label="Select language"
                  >
                    <span className="lang-flag">{currentLang.flag}</span>
                    <span className="lang-code">{currentLang.code.toUpperCase()}</span>
                    <span className="lang-arrow">▼</span>
                  </button>
                  
                  {isLangMenuOpen && (
                    <div className="lang-menu">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
                          onClick={() => changeLanguage(lang.code)}
                        >
                          <span className="lang-flag">{lang.flag}</span>
                          <span className="lang-label">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <h1 className="hero-title">{t('hero.title')}</h1>
              <p className="hero-subtitle">
                {t('hero.subtitle')}
              </p>
            </div>
          </section>

          {/* About Section */}
          <section className="section" id="about">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item">
                  <h2 className="section-heading">{t('about.title')}</h2>
                </div>
                <div className="grid-item">
                  <p className="body-text">
                    {t('about.desc1')}
                  </p>
                  <p className="body-text">
                    {t('about.desc2')}
                  </p>
                </div>
              </div>
            </div>
          </section>


          <section className="section" id="divisions">
            <div className="section-wrapper">
              <h2 className="section-heading-center">{t('divisions.title')}</h2>
              <div className="divisions-grid">
                <div className="division-card" onClick={() => toggleDivision('educational')}>
                  <h3 className="division-title">{t('divisions.educational.title')}</h3>
                  <p className="division-desc">{t('divisions.educational.desc')}</p>
                  {expandedDivision === 'educational' && (
                    <div className="flow flow-panel flow-visible">
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.educational.sessions.title')}</h4><p>{t('divisions.educational.sessions.text')}</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.educational.advisory.title')}</h4><p>{t('divisions.educational.advisory.text')}</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.educational.partnerships.title')}</h4><p>{t('divisions.educational.partnerships.text')}</p></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="division-card" onClick={() => toggleDivision('3dprint')}>
                  <h3 className="division-title">{t('divisions.print3d.title')}</h3>
                  <p className="division-desc">{t('divisions.print3d.desc')}</p>
                  {expandedDivision === '3dprint' && (
                    <div className="flow flow-panel flow-visible">
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.print3d.prototypes.title')}</h4><p>{t('divisions.print3d.prototypes.text')}</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.print3d.materials.title')}</h4><p>{t('divisions.print3d.materials.text')}</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.print3d.integration.title')}</h4><p>{t('divisions.print3d.integration.text')}</p></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="division-card" onClick={() => toggleDivision('xr')}>
                  <h3 className="division-title">{t('divisions.xr.title')}</h3>
                  <p className="division-desc">{t('divisions.xr.desc')}</p>
                  {expandedDivision === 'xr' && (
                    <div className="flow flow-panel flow-visible">
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.xr.simulators.title')}</h4><p>{t('divisions.xr.simulators.text')}</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.xr.interaction.title')}</h4><p>{t('divisions.xr.interaction.text')}</p></div>
                      </div>
                      <div className="flow-item">
                        <div className="flow-bullet" />
                        <div className="flow-content"><h4>{t('divisions.xr.optimization.title')}</h4><p>{t('divisions.xr.optimization.text')}</p></div>
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
                  <h2 className="contact-heading">{t('contact.title')}</h2>
                  <p className="contact-tagline">{t('contact.desc')}</p>
                  <ul className="contact-feature-list">
                    <li className="feature-item">{t('contact.email')}</li>
                    <li className="feature-item">{t('contact.location')}</li>
                  </ul>
                </div>
                <div className="grid-item">
                  <div className="contact-card">
                    <h3 className="contact-title">{t('contact.title')}</h3>
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
              <p className="footer-text">© 2024 Coresearch. {t('footer.rights')}</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}
