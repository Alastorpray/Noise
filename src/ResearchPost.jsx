import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PortableText } from '@portabletext/react'
import { client } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { ShareButtons } from './ShareButtons'
import { SEO, SITE_ORIGIN } from './SEO'
import { DEFAULT_LANG } from './index'
import { DotSpotlight } from './DotSpotlight'
import { ScrollProgress } from './ScrollProgress'
import { ptComponents, BODY_PROJECTION } from './portableTextComponents'
import './landing.css'

const RESEARCH_QUERY = `*[_type == "research" && slug.current == $slug]
  | order((language == $lang) desc, (language == $defaultLang) desc)[0] {
  title, refCode, fieldOfStudy, abstract, publishedAt, doi, language,
  "pdfUrl": pdfFile.asset->url,
  ${BODY_PROJECTION}
}`

export function ResearchPost({ slug, onNavigate }) {
  const { t, i18n } = useTranslation()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestedLang = (i18n.language || DEFAULT_LANG).split('-')[0]

  useEffect(() => {
    setLoading(true)
    client.fetch(RESEARCH_QUERY, { slug, lang: requestedLang, defaultLang: DEFAULT_LANG })
      .then(data => {
        if (!data) throw new Error('Research entry not found')
        setEntry(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('[Research] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [slug, requestedLang])

  const isFallbackLang = entry && entry.language !== requestedLang
  const year = entry?.publishedAt ? new Date(entry.publishedAt).getFullYear() : null

  return (
    <div className="page-content expanded">
      <DotSpotlight fixed />
      {entry && (
        <>
          <ScrollProgress />
          <SEO
            title={entry.title}
            description={entry.abstract || undefined}
            url={isFallbackLang ? `${SITE_ORIGIN}/${entry.language}/research/${slug}` : undefined}
          />
        </>
      )}

      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
      <section className="section">
        <div className="section-wrapper blog-post-wrapper">
          <button
            type="button"
            className="blog-post-back-btn"
            onClick={() => onNavigate('/research')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            {t('research.back', 'Back to Research')}
          </button>

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

          {entry && (
            <article lang={entry.language}>
              {isFallbackLang && (
                <div className="blog-post-translation-notice" role="status">
                  {t('post.translationMissing', {
                    requested: t(`languages.${requestedLang}`, requestedLang),
                    actual: t(`languages.${entry.language}`, entry.language),
                  })}
                </div>
              )}
              <header className="blog-post-header">
                <Reveal as="div" delay={0.05}>
                  <div className="research-post-meta">
                    {entry.refCode && <span className="publication-entry__ref">{entry.refCode}</span>}
                    {entry.fieldOfStudy && (
                      <span className="publication-entry__tag publication-entry__tag--field">
                        {entry.fieldOfStudy}
                      </span>
                    )}
                    {year && <span className="publication-entry__year">{year}</span>}
                  </div>
                </Reveal>

                <AnimatedWords
                  as="h1"
                  className="blog-post-title"
                  text={entry.title}
                  delay={120}
                  stagger={60}
                />

                {entry.abstract && (
                  <Reveal as="p" className="blog-post-p research-post-abstract" delay={0.25}>
                    {entry.abstract}
                  </Reveal>
                )}
              </header>

              {(entry.pdfUrl || entry.doi) && (
                <Reveal as="div" className="research-post-links" delay={0.3}>
                  {entry.pdfUrl && (
                    <a
                      className="publication-entry__link"
                      href={entry.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('research.download', 'PDF')} ↓
                    </a>
                  )}
                  {entry.doi && (
                    <a
                      className="publication-entry__link"
                      href={entry.doi}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('research.doi', 'DOI')} ↗
                    </a>
                  )}
                </Reveal>
              )}

              {entry.body?.length > 0 && (
                <Reveal as="div" className="blog-content blog-post-body" delay={0.35}>
                  <PortableText value={entry.body} components={ptComponents} />
                </Reveal>
              )}

              <ShareButtons title={entry.title} />
            </article>
          )}
        </div>
      </section>
      </div>

      <Footer />
    </div>
  )
}
