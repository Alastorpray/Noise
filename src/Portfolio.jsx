import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'

const FILTERS = ['all', 'xr', 'print3d', 'educational']

const QUERY = `*[_type == "project"] | order(featured desc, date desc) {
  _id, title, division, description, tags, date, featured, mediaType,
  cover, images, "videoUrl": video.asset->url
}`

export function Portfolio() {
  const { t } = useTranslation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    client.fetch(QUERY)
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('[Portfolio] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // Close lightbox on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = filter === 'all'
    ? projects
    : projects.filter(p => p.division === filter)

  return (
    <section className="section portfolio-section" id="portfolio">
      <div className="section-wrapper">
        <div className="portfolio-header">
          <h2 className="section-heading-center">{t('portfolio.title')}</h2>
          <div className="portfolio-filters">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`portfolio-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {t(`portfolio.${f}`)}
              </button>
            ))}
          </div>
        </div>

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

        {!loading && filtered.length === 0 && (
          <p className="portfolio-empty">{t('portfolio.empty')}</p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="portfolio-grid">
            {filtered.map((project, i) => (
              <ProjectCard
                key={project._id}
                project={project}
                index={i}
                onOpen={() => setLightbox(project)}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox
          project={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  )
}

function ProjectCard({ project, index, onOpen }) {
  const coverUrl = project.cover
    ? urlFor(project.cover).width(800).height(600).fit('crop').auto('format').url()
    : null

  return (
    <div
      className={`portfolio-card ${project.featured ? 'portfolio-card--featured' : ''}`}
      style={{ animationDelay: `${index * 0.07}s` }}
      onClick={onOpen}
    >
      <div className="portfolio-card-media">
        {project.mediaType === 'video' && project.videoUrl ? (
          <video
            src={project.videoUrl}
            muted
            loop
            playsInline
            className="portfolio-card-video"
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }}
          />
        ) : coverUrl ? (
          <img src={coverUrl} alt={project.title} className="portfolio-card-img" loading="lazy" />
        ) : (
          <div className="portfolio-card-placeholder" />
        )}
        <div className="portfolio-card-overlay">
          <span className="portfolio-card-cta">View Project</span>
        </div>
      </div>
      <div className="portfolio-card-info">
        <span className="portfolio-card-division">{project.division}</span>
        <h3 className="portfolio-card-title">{project.title}</h3>
        {project.description && (
          <p className="portfolio-card-desc">{project.description}</p>
        )}
        {project.tags?.length > 0 && (
          <div className="portfolio-card-tags">
            {project.tags.map(tag => (
              <span key={tag} className="portfolio-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Lightbox({ project, onClose }) {
  // Build array of all images: cover first, then gallery images
  const allImages = []
  if (project.cover) allImages.push(project.cover)
  if (project.images?.length > 0) {
    project.images.forEach(img => allImages.push(img))
  }

  const [currentIndex, setCurrentIndex] = useState(0)
  const hasMultiple = allImages.length > 1 || (project.mediaType === 'video' && project.videoUrl)
  const isVideo = project.mediaType === 'video' && project.videoUrl

  const goNext = useCallback((e) => {
    e?.stopPropagation()
    setCurrentIndex(i => (i + 1) % allImages.length)
  }, [allImages.length])

  const goPrev = useCallback((e) => {
    e?.stopPropagation()
    setCurrentIndex(i => (i - 1 + allImages.length) % allImages.length)
  }, [allImages.length])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const currentImgUrl = allImages[currentIndex]
    ? urlFor(allImages[currentIndex]).width(1400).auto('format').url()
    : null

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-panel" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="lightbox-media">
          {isVideo ? (
            <video
              src={project.videoUrl}
              controls
              autoPlay
              className="lightbox-video"
            />
          ) : currentImgUrl ? (
            <img src={currentImgUrl} alt={`${project.title} ${currentIndex + 1}`} className="lightbox-img" />
          ) : null}

          {!isVideo && hasMultiple && (
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
                {currentIndex + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>

        <div className="lightbox-info">
          <span className="portfolio-card-division">{project.division}</span>
          <h2 className="lightbox-title">{project.title}</h2>
          {project.description && (
            <p className="lightbox-desc">{project.description}</p>
          )}
          {project.tags?.length > 0 && (
            <div className="portfolio-card-tags">
              {project.tags.map(tag => (
                <span key={tag} className="portfolio-tag">{tag}</span>
              ))}
            </div>
          )}
          {project.date && (
            <span className="lightbox-date">
              {new Date(project.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
