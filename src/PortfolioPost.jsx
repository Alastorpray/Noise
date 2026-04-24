import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { ShareButtons } from './ShareButtons'
import { SEO, SITE_ORIGIN } from './SEO'
import { DEFAULT_LANG } from './index'
import './landing.css'

const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug]
  | order((language == $lang) desc, (language == $defaultLang) desc)[0] {
  title, division, description, tags, date, mediaType, language,
  cover, images, "videoUrl": video.asset->url
}`

const SIBLINGS_QUERY = `*[_type == "project" && defined(slug.current) && language == $lang] | order(featured desc, date desc) {
  title, "slug": slug.current
}`

export function PortfolioPost({ slug, onNavigate }) {
  const { t, i18n } = useTranslation()
  const [project, setProject] = useState(null)
  const [siblings, setSiblings] = useState([])
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
        return client.fetch(SIBLINGS_QUERY, { lang: data.language })
      })
      .then(list => {
        setSiblings(list || [])
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

  const projectImage = project ? `${SITE_ORIGIN}/og/project/${slug}?lang=${project.language}` : undefined

  return (
    <div className="page-content expanded">
      {project && (
        <SEO
          title={project.title}
          description={project.description || undefined}
          image={projectImage}
          url={isFallbackLang ? `${SITE_ORIGIN}/${project.language}/portfolio/${slug}` : undefined}
          type="article"
          publishedTime={project.date}
        />
      )}
      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
        <section className="section">
          <div className="section-wrapper blog-post-wrapper">

            <button
              onClick={() => onNavigate('/portfolio')}
              className="blog-post-back-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {t('portfolio.back', 'Back to Portfolio')}
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
                <header className="blog-post-header" style={{ marginBottom: '2rem' }}>
                  <Reveal as="div" className="blog-post-categories" delay={0.05}>
                    <span className="blog-post-category">
                      {project.division}
                    </span>
                  </Reveal>

                  <AnimatedWords
                    as="h1"
                    className="blog-post-title"
                    text={project.title}
                    delay={120}
                    stagger={55}
                  />

                  <Reveal as="div" className="blog-post-meta" delay={0.15}>
                    <div>
                      {project.date && <div>{new Date(project.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</div>}
                    </div>
                  </Reveal>
                </header>

                {/* Main Media */}
                <Reveal as="div" className="blog-post-main-img-wrapper" delay={0.25} style={{ background: '#000' }}>
                  {project.mediaType === 'video' && project.videoUrl ? (
                    <video
                      src={project.videoUrl}
                      controls
                      autoPlay
                      loop
                      className="blog-post-main-img"
                    />
                  ) : project.cover ? (
                    <img
                      src={urlFor(project.cover).width(1200).auto('format').url()}
                      alt={project.title}
                      className="blog-post-main-img"
                    />
                  ) : null}
                </Reveal>

                {/* Description and Tags */}
                <Reveal as="div" className="blog-content blog-post-body" delay={0.35} style={{ marginBottom: '3rem' }}>
                  {project.description && (
                    <p className="blog-post-p" style={{ whiteSpace: 'pre-wrap' }}>
                      {project.description}
                    </p>
                  )}
                  
                  {project.tags?.length > 0 && (
                    <div className="portfolio-card-tags" style={{ marginTop: '2rem' }}>
                      {project.tags.map(tag => (
                        <span key={tag} className="portfolio-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </Reveal>

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

                <ShareButtons title={project.title} />

                <PostNav
                  prev={prev}
                  next={next}
                  basePath="/portfolio"
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
