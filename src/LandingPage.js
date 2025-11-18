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
              <div className="nav-brand">
                <div className="nav-logo">CORE</div>
                <div className="nav-tagline">Research</div>
              </div>
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
                    Equipo multidisciplinar especializado en investigación aplicada y desarrollo de
                    soluciones digitales. Diseñamos y validamos tecnologías con impacto real en negocio.
                  </p>
                  <p className="body-text">
                    Combinamos prototipado rápido, experimentación controlada y transferencia a
                    producción para acortar el ciclo entre idea y resultado.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="capacidades">
            <div className="section-wrapper">
              <h2 className="section-heading-center">Capacidades</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <h3 className="feature-title">I+D de Producto</h3>
                  <p className="feature-desc">Validación técnica y de mercado, prototipos funcionales y roadmaps.</p>
                </div>
                <div className="feature-card">
                  <h3 className="feature-title">Experiencias 3D</h3>
                  <p className="feature-desc">Visualizaciones interactivas, simulaciones y interfaces inmersivas.</p>
                </div>
                <div className="feature-card">
                  <h3 className="feature-title">Data & AI</h3>
                  <p className="feature-desc">Modelos, pipelines y evaluación con métricas accionables.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="areas">
            <div className="section-wrapper">
              <h2 className="section-heading-center">Áreas de Investigación</h2>
              <div className="badge-grid">
                <span className="badge">Visualización científica</span>
                <span className="badge">Interacción hombre‑máquina</span>
                <span className="badge">Simulación en tiempo real</span>
                <span className="badge">Sistemas inteligentes</span>
                <span className="badge">Prototipado avanzado</span>
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
                    Estudios, hipótesis contrastadas y experimentos replicables para reducir incertidumbre.
                  </p>
                </div>
                <div className="service-card">
                  <h3 className="service-card-title">Desarrollo</h3>
                  <p className="service-card-desc">
                    Implementación robusta y escalable con integración continua y métricas de calidad.
                  </p>
                </div>
                <div className="service-card">
                  <h3 className="service-card-title">Consultoría</h3>
                  <p className="service-card-desc">
                    Alineación estratégica y hojas de ruta técnicas para acelerar la transferencia.
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
