import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'
import { AnimatedWords } from './AnimatedText'

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
    <section className="section" id="portfolio">
      <header className="editorial-hero">
        <span className="editorial-hero__eyebrow reveal-up">{t('portfolio.eyebrow', 'Portfolio')}</span>
        <AnimatedWords
          as="h1"
          className="editorial-hero__title"
          text={t('portfolio.heroTitle', 'Work.')}
          delay={150}
          stagger={70}
        />
        <p className="editorial-hero__subtitle reveal-up reveal-delay-4">
          {t('portfolio.heroSubtitle', 'Selected projects across XR, 3D printing, educational tools and interactive experiences.')}
        </p>
      </header>

      <div className="section-wrapper" style={{ padding: 0 }}>
        <div
          className="portfolio-filters"
          style={{
            padding: 'var(--space-lg) var(--space-xl)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)'
          }}
        >
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
          <div className="editorial-list editorial-list--minimal">
            {filtered.map((project, i) => (
              <ProjectEntry
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

function ProjectEntry({ project, index, onOpen }) {
  const { t } = useTranslation()
  const dateStr = project.date
    ? new Date(project.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null
  const division = project.division ? t(`portfolio.${project.division}`, project.division) : null

  return (
    <article
      className="editorial-entry"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={onOpen}
    >
      <div className="editorial-entry__date-col">
        {dateStr && <span className="editorial-entry__date">{dateStr}</span>}
        {division && <span className="editorial-entry__meta">{division}</span>}
      </div>
      <div className="editorial-entry__text">
        <h3 className="editorial-entry__title">{project.title}</h3>
        {project.description && (
          <p className="editorial-entry__excerpt">{project.description}</p>
        )}
      </div>
    </article>
  )
}
