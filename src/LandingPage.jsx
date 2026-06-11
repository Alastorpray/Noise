import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import emailjs from '@emailjs/browser'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import './landing.css'

import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { SEO } from './SEO'

const FIELDS = [
  { key: 'educational', items: ['sessions', 'advisory', 'partnerships'] },
  { key: 'print3d', items: ['prototypes', 'materials', 'integration'] },
  { key: 'xr', items: ['simulators', 'interaction', 'optimization'] },
]

const METHOD_STEPS = ['step1', 'step2', 'step3', 'step4']

const headerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'tween', duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const headerRule = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { type: 'tween', duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] } },
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
      <motion.span className="section-header__label" variants={headerItem}>{label}</motion.span>
      <motion.span className="section-header__rule" variants={headerRule} style={{ originX: 0 }} aria-hidden="true" />
    </motion.div>
  )
}

export function LandingPage({ initialSection = null, theme = 'dark' }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [form, setForm] = useState({ nombre: '', email: '', empresa: '', mensaje: '' })
  const [formStatus, setFormStatus] = useState('idle')
  const [expandedField, setExpandedField] = useState(null)

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
    setExpandedField((prev) => (prev === key ? null : key))
  }

  const goToPublications = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/publications' }))
  }

  return (
    <div className={`page-content expanded page-content--home theme-${theme}`}>
      <SEO description={t('about.desc1')} />

      <div className="landing-sections" id="top">
        {/* About — opening statement */}
        <section className="section section--opening" id="about">
          <div className="section-wrapper">
            <SectionHeader index="01" label={t('about.label')} />
            <div className="grid-2 grid-2--loose">
              <div className="grid-col">
                <Reveal as="span" className="about-eyebrow" delay={0.05}>
                  Coresearch — {t('about.eyebrow')}
                </Reveal>
                <AnimatedWords
                  as="h1"
                  className="about-title"
                  text={t('about.title')}
                  delay={150}
                  stagger={70}
                />
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
            <Reveal className="about-meta" delay={0.3}>
              <div className="about-meta__item">
                <span className="about-meta__key">{t('about.metaFields')}</span>
                <span className="about-meta__value">{t('about.metaFieldsValue')}</span>
              </div>
              <div className="about-meta__item">
                <span className="about-meta__key">{t('about.metaMethod')}</span>
                <span className="about-meta__value">{t('about.metaMethodValue')}</span>
              </div>
              <div className="about-meta__item">
                <span className="about-meta__key">{t('about.metaArchive')}</span>
                <span className="about-meta__value">{t('about.metaArchiveValue')}</span>
              </div>
            </Reveal>
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

            <div className="field-index">
              {FIELDS.map(({ key, items }, i) => {
                const open = expandedField === key
                return (
                  <motion.div
                    key={key}
                    className={`field-row ${open ? 'field-row--open' : ''}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
                    transition={reduceMotion ? undefined : { type: 'tween', duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.05 + i * 0.07 }}
                  >
                    <button
                      type="button"
                      className="field-row__head"
                      onClick={() => toggleField(key)}
                      aria-expanded={open}
                    >
                      <span className="field-row__number">{String(i + 1).padStart(2, '0')}</span>
                      <span className="field-row__title">{t(`fields.${key}.title`)}</span>
                      <span className="field-row__desc">{t(`fields.${key}.desc`)}</span>
                      <span className="field-row__toggle" aria-hidden="true">{open ? '−' : '+'}</span>
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
                  </motion.div>
                )
              })}

              <Reveal className="field-row field-row--expanding" delay={0.25}>
                <div className="field-row__head field-row__head--static">
                  <span className="field-row__number">∞</span>
                  <span className="field-row__title field-row__title--muted">{t('fields.expanding.title')}</span>
                  <span className="field-row__desc">{t('fields.expanding.desc')}</span>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Method */}
        <section className="section" id="method">
          <div className="section-wrapper">
            <SectionHeader index="03" label={t('method.label')} />
            <Reveal as="h2" className="about-title method-title" delay={0.1}>
              {t('method.title')}
            </Reveal>
            <div className="method-grid">
              {METHOD_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  className="method-step"
                  initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
                  transition={reduceMotion ? undefined : { type: 'tween', duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.05 + i * 0.09 }}
                >
                  <span className="method-step__number">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="method-step__title">{t(`method.${step}.title`)}</h3>
                  <p className="method-step__text">{t(`method.${step}.text`)}</p>
                </motion.div>
              ))}
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
            <SectionHeader index="04" label={t('nav.contact')} />
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
