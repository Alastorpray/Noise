import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import { VideoPlayer } from './VideoPlayer'
import { ptComponents, BODY_PROJECTION } from './portableTextComponents'
import './landing.css'

const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug]
  | order((language == $lang) desc, (language == $defaultLang) desc)[0] {
  title, division, description, tags, mediaType, language,
  client, sector, role, deliveredAt,
  "status": coalesce(status, "delivered"),
  "startedAt": coalesce(startedAt, date),
  cover, images, "videoUrl": video.asset->url,
  ${BODY_PROJECTION}
}`

const SIBLINGS_QUERY = `*[_type == "project" && defined(slug.current) && language == $lang]
  | order(featured desc, coalesce(startedAt, date) desc) {
  title, "slug": slug.current
}`

// Log entries live in \`post\` and point back with a plain slug rather than a
// reference, so the link survives the EN/ES/DE duplication of both documents.
// Every language is fetched at once so the log can fall back when the visitor's
// language has no entries yet — the bodies stay behind on the entry pages.
const LOG_QUERY = `*[_type == "post" && projectKey == $slug] | order(publishedAt asc) {
  _id, title, "slug": slug.current, publishedAt, excerpt, mainImage, language
}`

export function PortfolioPost({ slug, onNavigate }) {
  const { t, i18n } = useTranslation()
  const [project, setProject] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [logAll, setLogAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Lightbox state for gallery images
  const [lightboxImg, setLightboxImg] = useState(null)
  const requestedLang = (i18n.language || DEFAULT_LANG).split('-')[0]

  useEffect(() => {
    setLoading(true)
    client.fetch(PROJECT_QUERY, { slug, lang: requestedLang, defaultLang: DEFAULT_LANG })
      .then(data => {
        if (!data) throw new Error('Project not found')
        setProject(data)
        return Promise.all([
          client.fetch(SIBLINGS_QUERY, { lang: data.language }),
          client.fetch(LOG_QUERY, { slug }),
        ])
      })
      .then(([list, entries]) => {
        setSiblings(list || [])
        setLogAll(entries || [])
        setLoading(false)
      })
      .catch(e => {
        console.error('[Portfolio] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [slug, requestedLang])

  const isFallbackLang = project && project.language !== requestedLang

  const currentIdx = siblings.findIndex(p => p.slug === slug)
  const prev = currentIdx > 0 ? siblings[currentIdx - 1] : null
  const next = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  // Key listener for lightbox
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLightboxImg(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A log written in one language should still show up for every visitor, the
  // same way the project itself falls back instead of rendering nothing.
  const { log, logLang } = useMemo(() => {
    const langs = [...new Set(logAll.map(e => e.language).filter(Boolean))]
    if (!langs.length) return { log: [], logLang: null }
    const pick = langs.includes(requestedLang) ? requestedLang
      : langs.includes(DEFAULT_LANG) ? DEFAULT_LANG
      : langs[0]
    return { log: logAll.filter(e => e.language === pick), logLang: pick }
  }, [logAll, requestedLang])

  const locale = i18n.language || DEFAULT_LANG
  const isWip = project?.status === 'in-progress'

  const formatMonth = useCallback(
    (value) => value ? new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'long' }) : null,
    [locale]
  )

  // Factual spine of the sheet: who it was for, what we did, when. Rendered as
  // key/value rows so a project page reads as a record and not as an article.
  const sheet = useMemo(() => {
    if (!project) return []
    const rows = []
    if (project.client) {
      rows.push({ label: t('projects.client', 'Client'), value: project.client })
    } else if (project.sector) {
      rows.push({ label: t('projects.sector', 'Sector'), value: project.sector })
    }
    if (project.role) {
      rows.push({ label: t('projects.role', 'Role'), value: project.role })
    }
    const started = formatMonth(project.startedAt)
    const delivered = formatMonth(project.deliveredAt)
    if (started) {
      rows.push({
        label: t('projects.period', 'Period'),
        value: isWip
          ? t('projects.since', { date: started, defaultValue: 'Since {{date}}' })
          : (delivered && delivered !== started) ? `${started} — ${delivered}` : started,
      })
    }
    rows.push({
      label: t('projects.status', 'Status'),
      value: isWip ? t('projects.inProgress', 'In progress') : t('projects.delivered', 'Delivered'),
    })
    return rows
  }, [project, isWip, formatMonth, t])

  const projectImage = project ? `${SITE_ORIGIN}/og/project/${slug}?lang=${project.language}` : undefined

  return (
    <div className="page-content expanded">
      <DotSpotlight fixed />
      {project && (
        <SEO
          title={project.title}
          description={project.description || undefined}
          image={projectImage}
          url={isFallbackLang ? `${SITE_ORIGIN}/${project.language}/projects/${slug}` : undefined}
          type="article"
          publishedTime={project.startedAt}
        />
      )}
      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
        <section className="section">
          <div className="section-wrapper blog-post-wrapper">

            <button
              onClick={() => onNavigate('/projects')}
              className="blog-post-back-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {t('projects.back', 'Back to Projects')}
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

            {!loading && project && (
              <article key={slug} lang={project.language}>
                {isFallbackLang && (
                  <div className="blog-post-translation-notice" role="status">
                    {t('post.translationMissing', {
                      requested: t(`languages.${requestedLang}`, requestedLang),
                      actual: t(`languages.${project.language}`, project.language),
                    })}
                  </div>
                )}
                {/* The cover reads as a banner behind the title: a full-bleed
                    image above the text just pushes the project out of view */}
                <Reveal
                  as="header"
                  className={`project-hero ${project.cover ? '' : 'project-hero--plain'}`}
                  delay={0.05}
                >
                  {project.cover && (
                    <>
                      <div
                        className="project-hero__media"
                        style={{ backgroundImage: `url(${urlFor(project.cover).width(1800).height(800).fit('crop').auto('format').url()})` }}
                        aria-hidden="true"
                      />
                      <div className="project-hero__scrim" aria-hidden="true" />
                    </>
                  )}
                  <div className="project-hero__content">
                    <div className="project-hero__tags">
                      <span className="project-hero__division">
                        {t(`projects.${project.division}`, project.division)}
                      </span>
                      {isWip && (
                        <span className="project-status project-status--wip project-status--on-media">
                          <span className="project-status__dot" aria-hidden="true" />
                          {t('projects.inProgress', 'In progress')}
                        </span>
                      )}
                    </div>
                    <AnimatedWords
                      as="h1"
                      className="project-hero__title"
                      text={project.title}
                      delay={120}
                      stagger={55}
                    />
                  </div>
                </Reveal>

                {sheet.length > 0 && (
                  <Reveal as="dl" className="project-sheet" delay={0.15}>
                    {sheet.map(({ label, value }) => (
                      <div className="project-sheet__row" key={label}>
                        <dt className="project-sheet__label">{label}</dt>
                        <dd className="project-sheet__value">{value}</dd>
                      </div>
                    ))}
                  </Reveal>
                )}

                {/* The project itself: a short read, with whatever media it needs */}
                {project.body?.length > 0 && (
                  <Reveal as="div" className="blog-content blog-post-body" delay={0.25} style={{ marginBottom: '3rem' }}>
                    <PortableText value={project.body} components={ptComponents} />
                  </Reveal>
                )}

                {project.mediaType === 'video' && project.videoUrl && (
                  <Reveal as="div" className="project-feature-video" delay={0.3}>
                    <VideoPlayer
                      src={project.videoUrl}
                      poster={project.cover ? urlFor(project.cover).width(1600).auto('format').url() : undefined}
                      label={project.title}
                    />
                  </Reveal>
                )}

                {/* Image Gallery */}
                {project.mediaType !== 'video' && project.images?.length > 0 && (
                  <div style={{ marginTop: '4rem' }}>
                    <h3 className="blog-post-h3" style={{ marginBottom: '1.5rem' }}>Gallery</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                      {project.images.map((img, idx) => (
                        <div
                          key={idx}
                          style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: 'var(--surface)' }}
                          onClick={() => setLightboxImg(idx)}
                        >
                          <img
                            src={urlFor(img).width(600).height(600).fit('crop').auto('format').url()}
                            alt={`Gallery ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ProjectLog
                  entries={log}
                  isWip={isWip}
                  locale={locale}
                  projectSlug={slug}
                  lang={requestedLang}
                  startedAt={project.startedAt}
                  deliveredAt={project.deliveredAt}
                  isFallback={Boolean(logLang) && logLang !== requestedLang}
                  fallbackLang={logLang}
                  onNavigate={onNavigate}
                  t={t}
                />

                {/* Tags — taxonomy footer, after the work itself */}
                {project.tags?.length > 0 && (
                  <div className="project-tags-footer">
                    <span className="project-tags-label">{t('post.tags', 'Tags')}</span>
                    <div className="project-tags-list">
                      {project.tags.map(tag => (
                        <span key={tag} className="portfolio-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <ShareButtons title={project.title} />

                <PostNav
                  prev={prev}
                  next={next}
                  basePath="/projects"
                  onNavigate={onNavigate}
                  t={t}
                />
              </article>
            )}
          </div>
        </section>
      </div>

      <Footer />

      {/* Lightbox for Gallery */}
      {lightboxImg !== null && project?.images && (
        <GalleryLightbox 
          images={project.images} 
          initialIndex={lightboxImg} 
          onClose={() => setLightboxImg(null)} 
        />
      )}
    </div>
  )
}

const formatEntryDate = (value, locale) => value
  ? new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  : null

// The dated entries of this project, as a grid you can scan. A project still
// running shows the newest first — that is what a reader coming back wants —
// while a finished one reads forwards, as a story. Numbering stays chronological.
function ProjectLog({ entries, isWip, locale, projectSlug, lang, startedAt, deliveredAt, isFallback, fallbackLang, onNavigate, t }) {
  const ordered = useMemo(() => {
    const numbered = entries.map((entry, i) => ({ ...entry, n: i + 1 }))
    return isWip ? [...numbered].reverse() : numbered
  }, [entries, isWip])

  // Grouped by month. `ordered` is already in reading direction and a Map keeps
  // insertion order, so the groups come out the right way round on their own.
  const groups = useMemo(() => {
    const map = new Map()
    ordered.forEach(entry => {
      const key = entry.publishedAt ? entry.publishedAt.slice(0, 7) : 'undated'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(entry)
    })
    return [...map.entries()].map(([key, items]) => ({ key, items }))
  }, [ordered])

  if (!ordered.length) return null

  return (
    <section className="project-log" aria-labelledby="project-log-heading">
      <div className="project-log__header">
        <h2 id="project-log-heading" className="project-log__heading">
          {t('projects.log', 'Log')}
        </h2>
        <span className="project-log__count">({ordered.length})</span>
        <span className="project-log__rule" aria-hidden="true" />
      </div>

      {isFallback && (
        <div className="blog-post-translation-notice" role="status">
          {t('post.translationMissing', {
            requested: t(`languages.${lang}`, lang),
            actual: t(`languages.${fallbackLang}`, fallbackLang),
          })}
        </div>
      )}

      <LogRhythm
        entries={entries}
        startedAt={startedAt}
        deliveredAt={deliveredAt}
        isWip={isWip}
        locale={locale}
        projectSlug={projectSlug}
        lang={lang}
        onNavigate={onNavigate}
        t={t}
      />

      {groups.map(({ key, items }) => (
        <section className="log-group" key={key}>
          <div className="log-group__header">
            <span className="log-group__label">{monthLabel(key, locale, t)}</span>
            <span className="log-group__count">({items.length})</span>
            <span className="log-group__rule" aria-hidden="true" />
          </div>
          <ul className="project-log__grid">
            {items.map(entry => (
              <li key={entry._id} className="project-log__cell">
                <LogCard
                  entry={entry}
                  locale={locale}
                  projectSlug={projectSlug}
                  lang={lang}
                  onNavigate={onNavigate}
                  t={t}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  )
}

function monthLabel(key, locale, t) {
  if (key === 'undated') return t('projects.undated', 'No date')
  const [year, month] = key.split('-')
  const label = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// The pulse of the project on one line: where the work was dense and where it
// stalled. A calendar answers "what happened on the 14th", which nobody asks
// about a log — this answers "how has this been going", which they do.
function LogRhythm({ entries, startedAt, deliveredAt, isWip, locale, projectSlug, lang, onNavigate, t }) {
  const rhythm = useMemo(() => {
    const dated = entries.filter(e => e.publishedAt)
    if (dated.length < 2) return null  // one entry is not a rhythm

    const times = dated.map(e => new Date(e.publishedAt).getTime())
    const first = Math.min(...times)
    const last = Math.max(...times)
    const startTime = Math.min(first, startedAt ? new Date(startedAt).getTime() : first)
    const endTime = Math.max(last, isWip
      ? Date.now()
      : (deliveredAt ? new Date(deliveredAt).getTime() : last))

    const span = endTime - startTime
    if (span <= 0) return null

    return {
      startTime,
      endTime,
      marks: dated.map(entry => ({
        ...entry,
        pct: ((new Date(entry.publishedAt).getTime() - startTime) / span) * 100,
      })),
    }
  }, [entries, startedAt, deliveredAt, isWip])

  if (!rhythm) return null

  const bound = (time) => new Date(time)
    .toLocaleDateString(locale, { month: 'short', year: 'numeric' })

  return (
    <nav className="log-rhythm" aria-label={t('projects.rhythm', 'Log timeline')}>
      <span className="log-rhythm__bound">{bound(rhythm.startTime)}</span>

      <span className="log-rhythm__track">
        <span className="log-rhythm__line" aria-hidden="true" />
        {rhythm.marks.map(mark => {
          const label = `${mark.title} · ${formatEntryDate(mark.publishedAt, locale)}`
          if (!mark.slug) {
            return (
              <span
                key={mark._id}
                className="log-rhythm__mark log-rhythm__mark--static"
                style={{ left: `${mark.pct}%` }}
                data-label={label}
              />
            )
          }
          const path = `/projects/${projectSlug}/log/${mark.slug}`
          return (
            <a
              key={mark._id}
              className="log-rhythm__mark"
              style={{ left: `${mark.pct}%` }}
              data-label={label}
              aria-label={label}
              href={`/${lang}${path}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                e.preventDefault()
                onNavigate(path)
              }}
            />
          )
        })}
      </span>

      <span className="log-rhythm__bound">
        {isWip ? t('projects.today', 'Today') : bound(rhythm.endTime)}
      </span>
    </nav>
  )
}

function LogCard({ entry, locale, projectSlug, lang, onNavigate, t }) {
  const index = String(entry.n).padStart(2, '0')
  const date = formatEntryDate(entry.publishedAt, locale)
  const path = entry.slug ? `/projects/${projectSlug}/log/${entry.slug}` : null

  const inner = (
    <>
      <span className="log-card__media">
        {entry.mainImage ? (
          <img
            src={urlFor(entry.mainImage).width(640).height(400).fit('crop').auto('format').url()}
            alt=""
            loading="lazy"
          />
        ) : (
          // No image is a layout problem in a grid, so the number becomes the art
          <span className="log-card__plate" aria-hidden="true">{index}</span>
        )}
        <span className="log-card__index" aria-hidden="true">{index}</span>
      </span>

      <span className="log-card__body">
        {date && (
          <time className="log-card__date" dateTime={entry.publishedAt}>{date}</time>
        )}
        <span className="log-card__title">{entry.title}</span>
        {entry.excerpt && <span className="log-card__excerpt">{entry.excerpt}</span>}
        {path && (
          <span className="log-card__cta">
            {t('projects.readEntry', 'Read entry')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        )}
      </span>
    </>
  )

  // An entry with no slug has no page to open — it still shows, it just is not
  // a link, rather than a link that goes nowhere.
  if (!path) {
    return <article className="log-card log-card--static">{inner}</article>
  }

  return (
    <article className="log-card">
      <a
        className="log-card__hit"
        href={`/${lang}${path}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          onNavigate(path)
        }}
      >
        {inner}
      </a>
    </article>
  )
}

function PostNav({ prev, next, basePath, onNavigate, t }) {
  if (!prev && !next) return null
  return (
    <nav className="post-nav" aria-label="Post navigation">
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

function GalleryLightbox({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const goNext = useCallback((e) => {
    e?.stopPropagation()
    setCurrentIndex(i => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback((e) => {
    e?.stopPropagation()
    setCurrentIndex(i => (i - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const currentImgUrl = urlFor(images[currentIndex]).width(2400).auto('format').url()

  return (
    <div className="lightbox-backdrop lightbox-backdrop--gallery" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="lightbox-panel lightbox-panel--gallery" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close lightbox-close--gallery" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="lightbox-media lightbox-media--gallery">
          <img src={currentImgUrl} alt={`Gallery ${currentIndex + 1}`} className="lightbox-img lightbox-img--gallery" />

          {images.length > 1 && (
            <>
              <button className="lightbox-arrow lightbox-arrow--left" onClick={goPrev} aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="lightbox-arrow lightbox-arrow--right" onClick={goNext} aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </button>
              <div className="lightbox-counter">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
