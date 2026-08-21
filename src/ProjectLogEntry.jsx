import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PortableText } from '@portabletext/react'
import { client, urlFor } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { ShareButtons } from './ShareButtons'
import { SEO, SITE_ORIGIN } from './SEO'
import { DEFAULT_LANG } from './index'
import { DotSpotlight } from './DotSpotlight'
import { ptComponents, BODY_PROJECTION } from './portableTextComponents'
import './landing.css'

const ENTRY_QUERY = `*[_type == "post" && slug.current == $slug]
  | order((language == $lang) desc, (language == $defaultLang) desc)[0] {
  title, publishedAt, excerpt, mainImage, language, projectKey,
  ${BODY_PROJECTION}
}`

// Siblings give the entry its number in the log and the previous/next links
const SIBLINGS_QUERY = `*[_type == "post" && projectKey == $projectKey && language == $lang]
  | order(publishedAt asc) {
  _id, title, "slug": slug.current
}`

const PARENT_QUERY = `*[_type == "project" && slug.current == $projectSlug]
  | order((language == $lang) desc, (language == $defaultLang) desc)[0] {
  title, "status": coalesce(status, "delivered")
}`

export function ProjectLogEntry({ projectSlug, slug, onNavigate }) {
  const { t, i18n } = useTranslation()
  const [entry, setEntry] = useState(null)
  const [parent, setParent] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const requestedLang = (i18n.language || DEFAULT_LANG).split('-')[0]
  const locale = i18n.language || DEFAULT_LANG

  useEffect(() => {
    setLoading(true)
    setError(null)
    client.fetch(ENTRY_QUERY, { slug, lang: requestedLang, defaultLang: DEFAULT_LANG })
      .then(data => {
        if (!data) throw new Error('Entry not found')
        setEntry(data)
        return Promise.all([
          client.fetch(PARENT_QUERY, { projectSlug, lang: requestedLang, defaultLang: DEFAULT_LANG }),
          client.fetch(SIBLINGS_QUERY, {
            projectKey: data.projectKey || projectSlug,
            lang: data.language,
          }),
        ])
      })
      .then(([project, list]) => {
        setParent(project || null)
        setSiblings(list || [])
        setLoading(false)
      })
      .catch(e => {
        console.error('[Log entry] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [projectSlug, slug, requestedLang])

  const isFallbackLang = entry && entry.language !== requestedLang
  const projectPath = `/projects/${projectSlug}`

  const currentIdx = siblings.findIndex(e => e.slug === slug)
  const prev = currentIdx > 0 ? siblings[currentIdx - 1] : null
  const next = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null
  const number = currentIdx >= 0 ? String(currentIdx + 1).padStart(2, '0') : null

  const dateStr = entry?.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const ogImage = entry ? `${SITE_ORIGIN}/og/post/${slug}?lang=${entry.language}` : undefined

  return (
    <div className="page-content expanded">
      <DotSpotlight fixed />
      {entry && (
        <SEO
          title={entry.title}
          description={entry.excerpt || undefined}
          image={ogImage}
          url={isFallbackLang
            ? `${SITE_ORIGIN}/${entry.language}${projectPath}/log/${slug}`
            : undefined}
          type="article"
          publishedTime={entry.publishedAt}
        />
      )}

      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
        <section className="section">
          <div className="section-wrapper blog-post-wrapper">

            <button
              onClick={() => onNavigate(projectPath)}
              className="blog-post-back-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {parent?.title
                ? t('projects.backToProject', { title: parent.title, defaultValue: 'Back to {{title}}' })
                : t('projects.back', 'Back to Projects')}
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

            {!loading && entry && (
              <article key={slug} lang={entry.language}>
                {isFallbackLang && (
                  <div className="blog-post-translation-notice" role="status">
                    {t('post.translationMissing', {
                      requested: t(`languages.${requestedLang}`, requestedLang),
                      actual: t(`languages.${entry.language}`, entry.language),
                    })}
                  </div>
                )}

                {/* Same banner treatment as the project it belongs to */}
                <Reveal
                  as="header"
                  className={`project-hero project-hero--entry ${entry.mainImage ? '' : 'project-hero--plain'}`}
                  delay={0.05}
                >
                  {entry.mainImage && (
                    <>
                      <div
                        className="project-hero__media"
                        style={{ backgroundImage: `url(${urlFor(entry.mainImage).width(1800).height(760).fit('crop').auto('format').url()})` }}
                        aria-hidden="true"
                      />
                      <div className="project-hero__scrim" aria-hidden="true" />
                    </>
                  )}
                  <div className="project-hero__content">
                    <div className="project-hero__tags">
                      {number && <span className="log-entry__number">{number}</span>}
                      <span className="project-hero__division">
                        {t('projects.log', 'Log')}
                        {parent?.title ? ` · ${parent.title}` : ''}
                      </span>
                    </div>
                    <AnimatedWords
                      as="h1"
                      className="project-hero__title"
                      text={entry.title}
                      delay={120}
                      stagger={55}
                    />
                    {dateStr && (
                      <time className="log-entry__date" dateTime={entry.publishedAt}>{dateStr}</time>
                    )}
                  </div>
                </Reveal>

                {entry.body?.length > 0 && (
                  <Reveal as="div" className="blog-content blog-post-body" delay={0.2} style={{ marginBottom: '3rem' }}>
                    <PortableText value={entry.body} components={ptComponents} />
                  </Reveal>
                )}

                <ShareButtons title={entry.title} />

                <EntryNav
                  prev={prev}
                  next={next}
                  basePath={`${projectPath}/log`}
                  onNavigate={onNavigate}
                  t={t}
                />
              </article>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

function EntryNav({ prev, next, basePath, onNavigate, t }) {
  if (!prev && !next) return null
  return (
    <nav className="post-nav" aria-label="Log navigation">
      {prev ? (
        <button
          type="button"
          className="post-nav__item post-nav__item--prev"
          onClick={() => onNavigate(`${basePath}/${prev.slug}`)}
        >
          <span className="post-nav__label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('post.previous', 'Previous')}
          </span>
          <span className="post-nav__title">{prev.title}</span>
        </button>
      ) : <span />}
      {next ? (
        <button
          type="button"
          className="post-nav__item post-nav__item--next"
          onClick={() => onNavigate(`${basePath}/${next.slug}`)}
        >
          <span className="post-nav__label">
            {t('post.next', 'Next')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
          <span className="post-nav__title">{next.title}</span>
        </button>
      ) : <span />}
    </nav>
  )
}
