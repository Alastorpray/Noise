import React, { useState, useEffect, useRef } from 'react'
import './landing.css'

export function LandingPage() {
  const [isExpanded, setIsExpanded] = useState(false)
  const inactivityTimer = useRef(null)
  const [form, setForm] = useState({ nombre: '', email: '', empresa: '', mensaje: '' })
  const [formStatus, setFormStatus] = useState('idle')

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
                <a href="#about" className="nav-link" onClick={(e) => onNavClick(e, '#about')}>About</a>
                <a href="#services" className="nav-link" onClick={(e) => onNavClick(e, '#services')}>Services</a>
                <a href="#portfolio" className="nav-link" onClick={(e) => onNavClick(e, '#portfolio')}>Portfolio</a>
                <a href="#contact" className="nav-link" onClick={(e) => onNavClick(e, '#contact')}>Contact</a>
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
                <div className="division-card">
                  <h3 className="division-title">Educational</h3>
                  <p className="division-desc">Formación y asesoramiento en desarrollo 3D y experiencias XR.</p>
                </div>
                <div className="division-card">
                  <h3 className="division-title">3D print development</h3>
                  <p className="division-desc">Development for additive manufacturing, prototyping and 3D print workflows.</p>
                </div>
                <div className="division-card">
                  <h3 className="division-title">XR development</h3>
                  <p className="division-desc">XR simulators and applications with Unity and Meta Quest 2/3.</p>
                </div>
              </div>
            </div>
          </section>


          {/* Services Section */}
          <section className="section" id="services">
            <div className="section-wrapper">
              <h2 className="section-heading-center">Services</h2>
              <div className="services-grid">
                <div className="service-card">
                  <h3 className="service-card-title">Research</h3>
                  <p className="service-card-desc">Studies, tested hypotheses and replicable experiments to reduce uncertainty.</p>
                </div>
                <div className="service-card">
                  <h3 className="service-card-title">Development</h3>
                  <p className="service-card-desc">Robust, scalable implementation with CI and quality metrics.</p>
                </div>
                <div className="service-card">
                  <h3 className="service-card-title">Consulting</h3>
                  <p className="service-card-desc">Strategic alignment and technical roadmaps to accelerate transfer.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="section" id="contact">
            <div className="section-wrapper">
              <div className="grid-2">
                <div className="grid-item">
                  <h2 className="section-heading">Let's work together</h2>
                </div>
                <div className="grid-item">
                  <p className="body-text">Got a project in mind? Tell us and we’ll get back to you.</p>
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
                      <button className="btn-primary" type="submit" disabled={formStatus === 'sending'}>
                        {formStatus === 'sending' ? 'Sending…' : 'Send'}
                      </button>
                      {formStatus === 'success' && <span className="form-success">Thanks, we’ll contact you soon.</span>}
                    </div>
                  </form>
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
