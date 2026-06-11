import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { client } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { SEO } from './SEO'
import './landing.css'

const PUBLICATIONS_QUERY = `*[_type == "publication" && language == $lang] | order(publishedAt desc) {
  _id, title, refCode, fieldOfStudy, abstract, publishedAt, doi,
  "pdfUrl": pdfFile.asset->url
}`

export function PublicationsPage() {
  const { t, i18n } = useTranslation()
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0]
    setLoading(true)
    client.fetch(PUBLICATIONS_QUERY, { lang })
      .then(data => {
        setPublications(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('[Publications] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [i18n.language])

  return (
    <div className="page-content expanded">
      <SEO
        title={t('publications.heroTitle', 'Publications.')}
        description={t('publications.heroSubtitle')}
      />
      <header className="editorial-hero">
        <Reveal as="span" className="editorial-hero__eyebrow" delay={0.05}>
          {t('publications.eyebrow', 'Archive')}
        </Reveal>
        <AnimatedWords
          as="h1"
          className="editorial-hero__title"
          text={t('publications.heroTitle', 'Publications.')}
          delay={150}
          stagger={70}
        />
        <Reveal as="p" className="editorial-hero__subtitle" delay={0.25}>
          {t('publications.heroSubtitle')}
        </Reveal>
      </header>

      <section className="section">
        <div className="section-wrapper" style={{ padding: 0 }}>
          {error && (
            <p className="portfolio-empty" style={{ color: 'var(--accent)' }}>
              Error: {error}
            </p>
          )}

          {loading && (
            <div className="portfolio-loading">
              <span className="portfolio-loading-dot" />
              <span className="portfolio-loading-dot" />
              <span className="portfolio-loading-dot" />
            </div>
          )}

          {!loading && publications.length === 0 && !error && (
            <p className="portfolio-empty">{t('publications.empty')}</p>
          )}

          {!loading && publications.length > 0 && (
            <div className="publication-list">
              {publications.map((pub, i) => {
                const year = pub.publishedAt ? new Date(pub.publishedAt).getFullYear() : null

                return (
                  <motion.article
                    key={pub._id}
                    className="publication-entry"
                    initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={reduceMotion ? undefined : { once: true, amount: 0.15 }}
                    transition={reduceMotion ? undefined : { type: 'tween', duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.05, 0.4) }}
                  >
                    <div className="publication-entry__ref-col">
                      {pub.refCode && <span className="publication-entry__ref">{pub.refCode}</span>}
                      {year && <span className="publication-entry__year">{year}</span>}
                    </div>
                    <div className="publication-entry__body">
                      {pub.fieldOfStudy && (
                        <div className="publication-entry__meta">
                          <span className="publication-entry__tag publication-entry__tag--field">
                            {pub.fieldOfStudy}
                          </span>
                        </div>
                      )}
                      <h3 className="publication-entry__title">{pub.title}</h3>
                      {pub.abstract && (
                        <p className="publication-entry__abstract">{pub.abstract}</p>
                      )}
                      {(pub.pdfUrl || pub.doi) && (
                        <div className="publication-entry__links">
                          {pub.pdfUrl && (
                            <a
                              className="publication-entry__link"
                              href={pub.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('publications.download', 'PDF')} ↓
                            </a>
                          )}
                          {pub.doi && (
                            <a
                              className="publication-entry__link"
                              href={pub.doi}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('publications.doi', 'DOI')} ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
