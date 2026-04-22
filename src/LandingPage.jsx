import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import emailjs from '@emailjs/browser'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import './landing.css'
import { audioManager } from './audioManager'

import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { SEO } from './SEO'

export function LandingPage({ initialExpanded = false, initialSection = null, theme = 'dark' }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [isClosing, setIsClosing] = useState(false)
  const inactivityTimer = useRef(null)
  const [form, setForm] = useState({ nombre: '', email: '', empresa: '', mensaje: '' })
  const [formStatus, setFormStatus] = useState('idle')
  const [expandedDivision, setExpandedDivision] = useState(null)
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
  const isStartingAudio = useRef(false)
  const hoverTimeoutRef = useRef(null)


  const handleAudioToggle = () => {
    if (!audioEnabled && audioInitialized.current) {
      audioManager.resumeContext()
      audioUnlocked.current = true
    }
    setAudioEnabled(prev => !prev)
  }

  const handleCollapse = useCallback(() => {
    setIsClosing(true)
    // Resetear el glitch inmediatamente
    setIsHovering(false)
    setGlitchIntensity(0)
    setTimeout(() => {
      window.dispatchEvent(new Event('landing-collapsed'))
      setIsExpanded(false)
      setIsClosing(false)
    }, 800) // Duración de la animación de colapso
  }, [])

  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    if (isExpanded && !isClosing) {
      inactivityTimer.current = setTimeout(() => {
        handleCollapse()
      }, 30000) // 30 segundos
    }
  }, [isExpanded, isClosing, handleCollapse])

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
  }, [isExpanded, isClosing, resetTimer])

  useEffect(() => {
    resetTimer()
  }, [isExpanded, resetTimer])

  // When starting expanded (coming from another page)
  useEffect(() => {
    if (initialExpanded) {
      window.dispatchEvent(new Event('landing-expanded'))
      if (initialSection) {
        const tryScroll = (attempt = 0) => {
          const el = document.getElementById(initialSection)
          if (!el) return
          if (window.__lenis) {
            window.__lenis.scrollTo(el, { offset: 0, duration: 1.2 })
          } else if (attempt < 10) {
            setTimeout(() => tryScroll(attempt + 1), 60)
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
        setTimeout(() => tryScroll(), 250)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageClick = () => {
    // Detener el audio completamente (no solo pausar)
    audioManager.stop()
    setIsHovering(false)
    setGlitchIntensity(0)
    setIsExpanded(true)
    window.dispatchEvent(new Event('landing-expanded'))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.mensaje) return
    setFormStatus('sending')

    emailjs.send(
      'service_2wg37bc',
      'template_fs99k9g',
      {
        name: form.nombre,
        email: form.email,
        title: form.empresa,
        message: form.mensaje,
        time: new Date().toLocaleString()
      },
      'MMELmUYXH6HQs18_s'
    )
      .then(() => {
        setFormStatus('success')
        setForm({ nombre: '', email: '', empresa: '', mensaje: '' })
      })
      .catch(() => {
        setFormStatus('error')
      })
  }


  const toggleDivision = (key) => {
    setExpandedDivision((prev) => (prev === key ? null : key))
  }

  const handleLogoMouseEnter = () => {
    // Limpiar timeout previo si existe
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    // Activar hover INMEDIATAMENTE (no esperar al audio)
    setIsHovering(true)

    // Activar AudioContext en background (sincrónico con user gesture)
    if (audioInitialized.current) {
      audioManager.resumeContext()
    }
  }

  const handleLogoMouseLeave = () => {
    // Limpiar timeout previo si existe
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Pequeño delay para evitar disparos rápidos
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false)
      hoverTimeoutRef.current = null
    }, 50)
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
      // Prevenir múltiples intentos simultáneos de iniciar audio
      if (isStartingAudio.current) {
        console.log('⏭️ Audio start already in progress, skipping...')
        return
      }

      // Iniciar o reanudar audio
      const startAudio = async () => {
        isStartingAudio.current = true

        try {
          if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
            await audioManager.resume()
          } else if (!audioManager.isPlaying && !audioManager.isTransitioning) {
            await audioManager.play()
          }
        } catch (err) {
          console.error('❌ Error starting audio:', err)
        } finally {
          // Delay para evitar re-entradas rápidas
          setTimeout(() => {
            isStartingAudio.current = false
          }, 100)
        }
      }

      startAudio()

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
      // Cancelar cualquier intento de inicio de audio pendiente
      isStartingAudio.current = false

      // Solo pausar el audio (mantiene la posición)
      audioManager.pause()
      setHoverDuration(0)
      hoverStartTime.current = 0

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
      <SEO description={t('hero.subtitle')} />
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
            className={`logo-text ${glitchIntensity > 0.01 ? 'glitch-active' : ''}`}
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
              style={{ color: isHovering ? '#ff6600' : '#FFFFFF' }}
            >
              CORE
            </div>
            <div
              className="logo-sub"
              data-text="Research"
              style={{ color: isHovering ? '#E8E8E8' : '#999999' }}
            >
              Research
            </div>
          </div>
        </div>
      )}

      {/* Contenido expandido */}
      {(isExpanded || isClosing) && (
        <div className={`page-content ${isClosing ? 'collapsed' : 'expanded'} theme-${theme}`}>
          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <AnimatedWords
                as="h1"
                className="hero-title"
                text={t('hero.title')}
                delay={120}
                stagger={55}
              />
              <Reveal as="p" className="hero-subtitle" delay={0.2}>
                {t('hero.subtitle')}
              </Reveal>
            </div>
          </section>

          {/* About Section */}
          <section className="section" id="about">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item">
                  <Reveal as="h2" className="section-heading" delay={0.05}>
                    {t('about.title')}
                  </Reveal>
                </div>
                <div className="grid-item">
                  <Reveal as="p" className="body-text" delay={0.1}>
                    {t('about.desc1')}
                  </Reveal>
                  <Reveal as="p" className="body-text" delay={0.16}>
                    {t('about.desc2')}
                  </Reveal>
                </div>
              </div>
            </div>
          </section>


          <section className="section" id="divisions">
            <div className="section-wrapper">
              <Reveal as="h2" className="section-heading-center" delay={0.05}>
                {t('divisions.title')}
              </Reveal>
              <div className="divisions-grid">
                <motion.div
                  className="division-card"
                  onClick={() => toggleDivision('educational')}
                  style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
                  initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
                  transition={reduceMotion ? undefined : { type: 'tween', duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                >
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
                </motion.div>
                <motion.div
                  className="division-card"
                  onClick={() => toggleDivision('3dprint')}
                  style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
                  initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
                  transition={reduceMotion ? undefined : { type: 'tween', duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                >
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
                </motion.div>
                <motion.div
                  className="division-card"
                  onClick={() => toggleDivision('xr')}
                  style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
                  initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
                  transition={reduceMotion ? undefined : { type: 'tween', duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.19 }}
                >
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
                </motion.div>
              </div>
            </div>
          </section>


          

          {/* CTA Section */}
          <section className="section" id="contact">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item contact-side">
                  <Reveal as="h2" className="contact-heading" delay={0.05}>
                    {t('contact.title')}
                  </Reveal>
                  <Reveal as="p" className="contact-tagline" delay={0.15}>
                    {t('contact.desc')}
                  </Reveal>
                  <ul className="contact-feature-list">
                    <li className="feature-item">
                      <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      {t('contact.email')}
                    </li>
                    <li className="feature-item">
                      <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      {t('contact.e2e')}
                    </li>
                    <li className="feature-item">
                      <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      {t('contact.speed')}
                    </li>
                    <li className="feature-item">
                      <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      {t('contact.location')}
                    </li>
                  </ul>
                </div>
                <div className="grid-item">
                  <div className="contact-card">
                    <h3 className="contact-title">{t('contact.title')}</h3>
                    <AnimatePresence mode="wait" initial={false}>
                      {formStatus !== 'success' ? (
                        <motion.form
                          key="form"
                          className="contact-form"
                          onSubmit={handleSubmit}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="input-row">
                            <div className="input-group">
                              <label htmlFor="nombre">{t('contact.form.name')}</label>
                              <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                              <label htmlFor="email">{t('contact.form.email')}</label>
                              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                            </div>
                          </div>
                          <div className="input-group">
                            <label htmlFor="empresa">{t('contact.form.company')}</label>
                            <input id="empresa" name="empresa" type="text" value={form.empresa} onChange={handleChange} />
                          </div>
                          <div className="input-group">
                            <label htmlFor="mensaje">{t('contact.form.message')}</label>
                            <textarea id="mensaje" name="mensaje" rows="4" value={form.mensaje} onChange={handleChange} required />
                          </div>
                          <div className="form-actions">
                            <button className="contact-submit" type="submit" disabled={formStatus === 'sending'}>
                              {formStatus === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
                            </button>
                            {formStatus === 'error' && <span className="form-error">{t('contact.form.error')}</span>}
                          </div>
                        </motion.form>
                      ) : (
                        <motion.div
                          key="success"
                          className="contact-success"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                        >
                          <svg className="contact-success__check" viewBox="0 0 52 52" aria-hidden="true">
                            <circle className="contact-success__circle" cx="26" cy="26" r="24" fill="none" />
                            <path className="contact-success__tick" fill="none" d="M14 27 L23 35 L39 18" />
                          </svg>
                          <h4 className="contact-success__title">{t('contact.form.successTitle', 'Thanks!')}</h4>
                          <p className="contact-success__text">{t('contact.form.success')}</p>
                          <button
                            type="button"
                            className="contact-success__reset"
                            onClick={() => setFormStatus('idle')}
                          >
                            {t('contact.form.sendAnother', 'Send another message')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <Footer />
        </div>
      )}
    </div>
  )
}
