import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'

const FILTERS = ['all', 'xr', 'print3d', 'educational', 'gameAsset']

const QUERY = `*[_type == "project"] | order(featured desc, date desc) {
  _id, title, slug, division, description, tags, date, featured, mediaType,
  cover, images, "videoUrl": video.asset->url
}`

export function Portfolio({ onNavigate }) {
  const { t } = useTranslation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

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
                onOpen={() => {
                  if (project.slug?.current) {
                    onNavigate(`/portfolio/${project.slug.current}`)
                  } else {
                    console.warn('Project is missing a slug. Please generate one in Sanity.')
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
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
