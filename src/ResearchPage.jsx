import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { client } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { SEO } from './SEO'
import { DotSpotlight } from './DotSpotlight'
import './landing.css'

const RESEARCH_QUERY = `*[_type == "research" && language == $lang] | order(publishedAt desc) {
  _id, title, refCode, fieldOfStudy, abstract, publishedAt, doi,
  "slug": slug.current, "hasBody": count(body) > 0,
  "pdfUrl": pdfFile.asset->url
}`

export function ResearchPage({ onNavigate }) {
  const { t, i18n } = useTranslation()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0]
    setLoading(true)
    client.fetch(RESEARCH_QUERY, { lang })
      .then(data => {
        setEntries(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('[Research] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [i18n.language])

  return (
    <div className="page-content expanded">
      <DotSpotlight fixed />
      <SEO
        title={t('research.heroTitle', 'Research.')}
        description={t('research.heroSubtitle')}
      />
      <header className="editorial-hero">
        <Reveal as="span" className="editorial-hero__eyebrow" delay={0.05}>
          {t('research.eyebrow', 'Archive')}
        </Reveal>
        <AnimatedWords
          as="h1"
          className="editorial-hero__title"
          text={t('research.heroTitle', 'Research.')}
          delay={150}
          stagger={70}
        />
        <Reveal as="p" className="editorial-hero__subtitle" delay={0.25}>
          {t('research.heroSubtitle')}
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

          {!loading && entries.length === 0 && !error && (
            <p className="portfolio-empty">{t('research.empty')}</p>
          )}

          {!loading && entries.length > 0 && (
            <div className="publication-list">
              {entries.map((pub, i) => {
                const year = pub.publishedAt ? new Date(pub.publishedAt).getFullYear() : null
                const readable = Boolean(pub.slug && pub.hasBody)

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
                      {readable ? (
                        <h3 className="publication-entry__title">
                          <a
                            href={`/research/${pub.slug}`}
                            className="publication-entry__title-link"
                            onClick={e => { e.preventDefault(); onNavigate(`/research/${pub.slug}`) }}
                          >
                            {pub.title}
                          </a>
                        </h3>
                      ) : (
                        <h3 className="publication-entry__title">{pub.title}</h3>
                      )}
                      {pub.abstract && (
                        <p className="publication-entry__abstract">{pub.abstract}</p>
                      )}
                      {(readable || pub.pdfUrl || pub.doi) && (
                        <div className="publication-entry__links">
                          {readable && (
                            <a
                              className="publication-entry__link publication-entry__link--read"
                              href={`/research/${pub.slug}`}
                              onClick={e => { e.preventDefault(); onNavigate(`/research/${pub.slug}`) }}
                            >
                              {t('research.read', 'Read')} →
                            </a>
                          )}
                          {pub.pdfUrl && (
                            <a
                              className="publication-entry__link"
                              href={pub.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('research.download', 'PDF')} ↓
                            </a>
                          )}
                          {pub.doi && (
                            <a
                              className="publication-entry__link"
                              href={pub.doi}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('research.doi', 'DOI')} ↗
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
