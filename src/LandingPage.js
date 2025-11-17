import React, { useState, useEffect, useRef } from 'react'
import './landing.css'

export function LandingPage() {
  const [isExpanded, setIsExpanded] = useState(false)
  const inactivityTimer = useRef(null)

  const resetTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    if (isExpanded) {
      inactivityTimer.current = setTimeout(() => {
        setIsExpanded(false)
      }, 30000) // 30 segundos
    }
  }

  useEffect(() => {
    const handleActivity = () => {
      resetTimer()
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
  }, [isExpanded])

  useEffect(() => {
    resetTimer()
  }, [isExpanded])

  const handleImageClick = () => {
    setIsExpanded(true)
  }

  return (
    <div className="landing-container">
      {/* Texto central */}
      {!isExpanded && (
        <div className="logo-container" onClick={handleImageClick}>
          <div className="logo-text">
            <div className="logo-main">CORE</div>
            <div className="logo-sub">Research</div>
          </div>
        </div>
      )}

      {/* Contenido expandido */}
      {isExpanded && (
        <div className={`page-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {/* Navigation */}
          <nav className="main-nav">
            <div className="nav-content">
              <div className="nav-logo">Coresearch</div>
              <div className="nav-links">
                <a href="#nosotros" className="nav-link">Nosotros</a>
                <a href="#servicios" className="nav-link">Servicios</a>
                <a href="#portfolio" className="nav-link">Portfolio</a>
                <a href="#contacto" className="nav-link">Contacto</a>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <h1 className="hero-title">Conectando mundos</h1>
              <p className="hero-subtitle">
                Transformamos ideas en experiencias digitales innovadoras que conectan personas,
                tecnologías y posibilidades infinitas.
              </p>
            </div>
          </section>

          {/* About Section */}
          <section className="section" id="nosotros">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item">
                  <h2 className="section-heading">Quiénes Somos</h2>
                </div>
                <div className="grid-item">
                  <p className="body-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua.
                  </p>
                  <p className="body-text">
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section className="section" id="servicios">
            <div className="section-wrapper">
              <h2 className="section-heading-center">Servicios</h2>
              <div className="services-grid">
                <div className="service-card">
                  <h3 className="service-card-title">Investigación</h3>
                  <p className="service-card-desc">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Análisis profundo
                    y metodologías innovadoras.
                  </p>
                </div>
                <div className="service-card">
                  <h3 className="service-card-title">Desarrollo</h3>
                  <p className="service-card-desc">
                    Soluciones tecnológicas a medida con las últimas herramientas y frameworks
                    del mercado.
                  </p>
                </div>
                <div className="service-card">
                  <h3 className="service-card-title">Consultoría</h3>
                  <p className="service-card-desc">
                    Asesoramiento estratégico para transformar tu visión en realidad digital.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="section" id="contacto">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item">
                  <h2 className="section-heading">Trabajemos juntos</h2>
                </div>
                <div className="grid-item">
                  <p className="body-text">
                    ¿Tienes un proyecto en mente? Nos encantaría escucharte y ayudarte a hacerlo
                    realidad.
                  </p>
                  <div className="cta-buttons">
                    <button className="btn-primary">Contactar</button>
                    <button className="btn-secondary">Portfolio</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <div className="footer-content">
              <p className="footer-text">© 2024 Coresearch. Conectando mundos.</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}
