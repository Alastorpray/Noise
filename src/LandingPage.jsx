import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import emailjs from '@emailjs/browser'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import './landing.css'

import { Footer } from './Footer'
import { Reveal } from './Reveal'
import { SEO } from './SEO'
import { DotSpotlight } from './DotSpotlight'

const FieldIcon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

/* pathLength=1 normaliza cada trazo para la animación de dibujado (stroke-dashoffset) */
const ICONS = {
  educational: (
    <FieldIcon>
      <path pathLength="1" d="M12 5.5C10.1 4.1 7.6 3.5 4.5 3.5v14c3.1 0 5.6.6 7.5 2 1.9-1.4 4.4-2 7.5-2v-14c-3.1 0-5.6.6-7.5 2z" />
      <path pathLength="1" d="M12 5.5v14" />
    </FieldIcon>
  ),
  print3d: (
    <FieldIcon>
      <path pathLength="1" d="M12 3.5l8 4-8 4-8-4 8-4z" />
      <path pathLength="1" d="M4 12.5l8 4 8-4" />
      <path pathLength="1" d="M4 16.5l8 4 8-4" />
    </FieldIcon>
  ),
  xr: (
    <FieldIcon>
      <path pathLength="1" d="M3 9.5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-3.2c-.6 0-1.18-.27-1.57-.73l-.93-1.1c-.68-.8-1.92-.8-2.6 0l-.93 1.1c-.39.46-.97.73-1.57.73H5c-1.1 0-2-.9-2-2v-4z" />
      <path pathLength="1" d="M7.5 10.75h.01M16.5 10.75h.01" />
    </FieldIcon>
  ),
  expanding: (
    <FieldIcon>
      <circle pathLength="1" cx="12" cy="12" r="8.5" />
      <path pathLength="1" d="M14.9 9.1l-1.7 4.1-4.1 1.7 1.7-4.1 4.1-1.7z" />
    </FieldIcon>
  ),
}

const HOME_SECTIONS = [
  { id: 'about', index: '01' },
  { id: 'fields', index: '02' },
  { id: 'contact', index: '03' },
]

const FIELDS = [
  { key: 'educational', items: ['sessions', 'advisory', 'partnerships'] },
  { key: 'print3d', items: ['prototypes', 'materials', 'integration'] },
  { key: 'xr', items: ['simulators', 'interaction', 'optimization'] },
]

const headerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'tween', duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const headerRule = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { type: 'tween', duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] } },
}

const BRAND = 'CORESEARCH'
// Glyph pool for the decode effect — data/archive characters
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789§Δ░▒█<>/'

/* Mini decode: el label se descifra una vez al entrar en viewport (gesto de marca) */
function DecodeLabel({ text }) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(text)
  const done = useRef(false)
  const frame = useRef(null)

  // Si cambia el idioma, mostrar el nuevo texto sin re-descifrar
  useEffect(() => { setDisplay(text) }, [text])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const start = () => {
    if (done.current || reduceMotion) return
    done.current = true
    const duration = 520
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const resolved = Math.floor(p * text.length)
      let out = ''
      for (let i = 0; i < text.length; i++) {
        out += i < resolved || text[i] === ' '
          ? text[i]
          : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0]
      }
      setDisplay(p < 1 ? out : text)
      if (p < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }

  return (
    <motion.span
      className="section-header__label"
      variants={headerItem}
      viewport={{ once: true, amount: 0.6 }}
      onViewportEnter={start}
    >
      {display}
    </motion.span>
  )
}

function SectionHeader({ index, label }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="section-header"
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ staggerChildren: 0.08 }}
    >
      <motion.span className="section-header__index" variants={headerItem}>§ {index}</motion.span>
      <DecodeLabel text={label} />
      <motion.span className="section-header__rule" variants={headerRule} style={{ originX: 0 }} aria-hidden="true" />
    </motion.div>
  )
}

export function LandingPage({ initialSection = null, theme = 'dark' }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [form, setForm] = useState({ nombre: '', email: '', empresa: '', mensaje: '' })
  const [formStatus, setFormStatus] = useState('idle')
  const [expandedFields, setExpandedFields] = useState([])
  const [scanLive, setScanLive] = useState(false)
  const [brandSwapped, setBrandSwapped] = useState(false)
  const brandBlockRef = useRef(null)
  const scanRaf = useRef(null)
  const scanTarget = useRef(0)
  const scanCurrent = useRef(0)
  const [drawnCards, setDrawnCards] = useState([])
  const [activeSection, setActiveSection] = useState('about')

  const markDrawn = (key) => {
    setDrawnCards((prev) => (prev.includes(key) ? prev : [...prev, key]))
  }

  // Línea de escaneo controlada por el cursor: divide el texto en
  // blanco (izquierda de la línea) / naranja (derecha), con inercia.
  const clampScanX = (clientX, rect) =>
    Math.min(Math.max(clientX - rect.left, 0), rect.width)

  const scanLoop = () => {
    scanRaf.current = requestAnimationFrame(() => {
      scanCurrent.current += (scanTarget.current - scanCurrent.current) * 0.22
      const el = brandBlockRef.current
      if (el) el.style.setProperty('--scan-x', `${scanCurrent.current.toFixed(1)}px`)
      if (Math.abs(scanTarget.current - scanCurrent.current) > 0.3) scanLoop()
      else scanRaf.current = null
    })
  }

  const handleBrandMove = (e) => {
    const el = brandBlockRef.current
    if (!el || reduceMotion) return
    scanTarget.current = clampScanX(e.clientX, el.getBoundingClientRect())
    if (!scanRaf.current) scanLoop()
  }

  const handleBrandEnter = (e) => {
    if (reduceMotion) return
    const el = brandBlockRef.current
    if (!el) return
    const x = clampScanX(e.clientX, el.getBoundingClientRect())
    scanTarget.current = x
    scanCurrent.current = x
    el.style.setProperty('--scan-x', `${x.toFixed(1)}px`)
    setScanLive(true)
  }

  // Al salir, la línea desaparece. Si superó el 50% del recorrido,
  // el intercambio de colores se confirma (toggle); si no, se descarta.
  const handleBrandLeave = () => {
    setScanLive(false)
    const el = brandBlockRef.current
    if (!el) return
    if (scanTarget.current > el.getBoundingClientRect().width / 2) {
      setBrandSwapped((s) => !s)
    }
  }

  useEffect(() => () => cancelAnimationFrame(scanRaf.current), [])

  // Índice lateral: sección activa según la franja central del viewport
  useEffect(() => {
    const scroller = document.querySelector('.page-content.expanded')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { root: scroller, rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    HOME_SECTIONS.forEach(({ id }) => {
      const target = document.getElementById(id)
      if (target) observer.observe(target)
    })
    return () => observer.disconnect()
  }, [])

  const jumpToSection = (id) => {
    const target = document.getElementById(id)
    if (!target) return
    if (window.__lenis) {
      window.__lenis.scrollTo(target, { offset: 0, duration: 1.1 })
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Scroll to a section when arriving from another page (e.g. nav "Contact")
  useEffect(() => {
    if (!initialSection) return
    const tryScroll = (attempt = 0) => {
      const el = document.getElementById(initialSection)
      if (!el) {
        if (attempt < 10) setTimeout(() => tryScroll(attempt + 1), 60)
        return
      }
      if (window.__lenis) {
        window.__lenis.scrollTo(el, { offset: 0, duration: 1.2 })
      } else if (attempt < 10) {
        setTimeout(() => tryScroll(attempt + 1), 60)
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    setTimeout(() => tryScroll(), 250)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const toggleField = (key) => {
    setExpandedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const goToPublications = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/publications' }))
  }

  return (
    <div className={`page-content expanded page-content--home theme-${theme}`}>
      <SEO description={t('about.desc1')} />

      <nav className="section-index" aria-label="Secciones">
        {HOME_SECTIONS.map(({ id, index }) => (
          <button
            key={id}
            type="button"
            className={`section-index__item ${activeSection === id ? 'section-index__item--active' : ''}`}
            onClick={() => jumpToSection(id)}
            aria-label={`§ ${index}`}
          >
            <span className="section-index__bar" aria-hidden="true" />
            {index}
          </button>
        ))}
      </nav>

      <div className="landing-sections" id="top">
        <DotSpotlight />
        {/* About — opening statement */}
        <section className="section section--opening" id="about">
          <div className="section-wrapper">
            <div className="opening-intro">
              <div className="grid-col">
                <div
                  ref={brandBlockRef}
                  className={`about-brand-block ${scanLive ? 'about-brand-block--live' : ''} ${brandSwapped ? 'about-brand-block--swapped' : ''}`}
                  onMouseEnter={handleBrandEnter}
                  onMouseMove={handleBrandMove}
                  onMouseLeave={handleBrandLeave}
                >
                  <Reveal as="h1" className="about-brand" delay={0.05} data-text={BRAND}>
                    {BRAND}
                  </Reveal>
                  <Reveal as="p" className="about-tagline" delay={0.15} data-text={t('about.title')}>
                    {t('about.title')}
                  </Reveal>
                  <span className="brand-scanline" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="opening-divider" aria-hidden="true" />
            <SectionHeader index="01" label={t('about.label')} />
            <div className="grid-2 grid-2--loose">
              <div className="grid-col">
                <Reveal as="p" className="about-title-sub" delay={0.18}>
                  {t('about.titleSub')}
                </Reveal>
              </div>
              <div className="grid-col">
                <Reveal as="p" className="body-text" delay={0.15}>
                  {t('about.desc1')}
                </Reveal>
                <Reveal as="p" className="body-text" delay={0.2}>
                  {t('about.desc2')}
                </Reveal>
                <Reveal as="p" className="body-text body-text--muted" delay={0.25}>
                  {t('about.desc3')}
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* Research fields — numbered index */}
        <section className="section" id="fields">
          <div className="section-wrapper">
            <SectionHeader index="02" label={t('fields.label')} />
            <div className="grid-2 grid-2--loose">
              <div className="grid-col">
                <Reveal as="h2" className="about-title" delay={0.1}>
                  {t('fields.title')}
                </Reveal>
              </div>
              <div className="grid-col">
                <Reveal as="p" className="body-text body-text--muted" delay={0.15}>
                  {t('fields.intro')}
                </Reveal>
              </div>
            </div>

            <div className="field-cards">
              {FIELDS.map(({ key, items }, i) => {
                const open = expandedFields.includes(key)
                return (
                  <motion.article
                    key={key}
                    className={`field-card ${open ? 'field-card--open' : ''} ${drawnCards.includes(key) ? 'field-card--drawn' : ''}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    onViewportEnter={() => markDrawn(key)}
                    transition={reduceMotion ? undefined : { type: 'tween', duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.05 + i * 0.09 }}
                  >
                    <button
                      type="button"
                      className="field-card__head"
                      onClick={() => toggleField(key)}
                      aria-expanded={open}
                    >
                      <span className="field-card__top">
                        <span className="field-card__icon">{ICONS[key]}</span>
                        <span className="field-card__index">{String(i + 1).padStart(2, '0')}</span>
                      </span>
                      <span className="field-card__title">{t(`fields.${key}.title`)}</span>
                      <span className="field-card__desc">{t(`fields.${key}.desc`)}</span>
                      <span className="field-card__toggle" aria-hidden="true">{open ? '−' : '+'}</span>
                    </button>
                    <div className={`flow flow-panel ${open ? 'flow-visible' : ''}`}>
                      {items.map((item) => (
                        <div className="flow-item" key={item}>
                          <div className="flow-bullet" />
                          <div className="flow-content">
                            <h4>{t(`fields.${key}.${item}.title`)}</h4>
                            <p>{t(`fields.${key}.${item}.text`)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.article>
                )
              })}

              <motion.div
                className={`field-card field-card--ghost ${drawnCards.includes('expanding') ? 'field-card--drawn' : ''}`}
                initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                onViewportEnter={() => markDrawn('expanding')}
                transition={reduceMotion ? undefined : { type: 'tween', duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              >
                <div className="field-card__ghost-inner">
                  <span className="field-card__icon field-card__icon--ghost">{ICONS.expanding}</span>
                  <span className="field-card__ghost-text">
                    <span className="field-card__title field-card__title--ghost">{t('fields.expanding.title')}</span>
                    <span className="field-card__desc">{t('fields.expanding.desc')}</span>
                  </span>
                </div>
              </motion.div>
            </div>

            <Reveal className="archive-cta" delay={0.2}>
              <button type="button" className="archive-cta__link" onClick={goToPublications}>
                {t('publications.viewIndex')}
                <span className="archive-cta__arrow" aria-hidden="true">→</span>
              </button>
            </Reveal>
          </div>
        </section>

        {/* Contact */}
        <section className="section" id="contact">
          <div className="section-wrapper">
            <SectionHeader index="03" label={t('nav.contact')} />
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
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
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

        <Footer />
      </div>
    </div>
  )
}
