import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { motion, useReducedMotion } from 'framer-motion'
import { SEO } from './SEO'

const DIVISION_ORDER = ['spatial', 'print3d', 'educational', 'gameAsset']

const QUERY = `*[_type == "project" && language == $lang]
  | order(featured desc, coalesce(startedAt, date) desc) {
  _id, title, slug, division, description, tags, featured, mediaType,
  "status": coalesce(status, "delivered"),
  "startedAt": coalesce(startedAt, date),
  cover, images, "videoUrl": video.asset->url
}`

const WIP_GROUP = 'wip'

export function Portfolio({ onNavigate }) {
  const { t, i18n } = useTranslation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)

  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0]
    setLoading(true)
    client.fetch(QUERY, { lang })
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('[Portfolio] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [i18n.language])

  // Catálogo agrupado por división, en orden fijo; lo desconocido cae en "other".
  // Los proyectos en curso salen de su división y se agrupan arriba: mezclados
  // por fecha, un WIP con dos entradas pierde siempre contra uno ya fotografiado.
  const groups = useMemo(() => {
    const live = projects.filter(p => p.status === 'in-progress')
    const map = {}
    projects.filter(p => p.status !== 'in-progress').forEach(p => {
      const key = DIVISION_ORDER.includes(p.division) ? p.division : 'other'
      if (!map[key]) map[key] = []
      map[key].push(p)
    })
    const byDivision = [...DIVISION_ORDER, 'other']
      .filter(key => map[key]?.length)
      .map(key => ({ key, items: map[key] }))
    return live.length ? [{ key: WIP_GROUP, items: live }, ...byDivision] : byDivision
  }, [projects])

  // Píldora activa según el grupo visible en la franja superior del viewport
  useEffect(() => {
    if (!groups.length) return
    const scroller = document.querySelector('.page-content.expanded')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveGroup(entry.target.dataset.group)
        })
      },
      { root: scroller, rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    groups.forEach(({ key }) => {
      const el = document.getElementById(`division-${key}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [groups])

  const jumpToGroup = (key) => {
    const el = document.getElementById(`division-${key}`)
    if (!el) return
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { offset: -4, duration: 1.1 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="section" id="projects">
      <SEO
        title={t('projects.title', 'Projects')}
        description={t('projects.heroSubtitle', 'Selected work across spatial computing, 3D printing, educational tools and interactive experiences — including projects still running.')}
      />
      <header className="editorial-hero">
        <Reveal as="span" className="editorial-hero__eyebrow" delay={0.05}>
          {t('projects.eyebrow', 'Projects')}
        </Reveal>
        <AnimatedWords
          as="h1"
          className="editorial-hero__title"
          text={t('projects.heroTitle', 'Projects.')}
          delay={150}
          stagger={70}
        />
        <Reveal as="p" className="editorial-hero__subtitle" delay={0.25}>
          {t('projects.heroSubtitle', 'Selected work across spatial computing, 3D printing, educational tools and interactive experiences — including projects still running.')}
        </Reveal>
      </header>

      <div className="section-wrapper" style={{ padding: 0 }}>
        {!loading && groups.length > 1 && (
          <div className="catalog-index">
            {groups.map(({ key, items }) => (
              <button
                key={key}
                className={`portfolio-filter-btn ${activeGroup === key ? 'active' : ''}`}
                onClick={() => jumpToGroup(key)}
              >
                {t(`projects.${key}`, key)}
                <span className="catalog-index__count">{items.length}</span>
              </button>
            ))}
          </div>
        )}

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

        {!loading && groups.length === 0 && (
          <p className="portfolio-empty">{t('projects.empty')}</p>
        )}

        {!loading && groups.map(({ key, items }, gi) => (
          <section
            className={`catalog-group ${key === WIP_GROUP ? 'catalog-group--wip' : ''}`}
            id={`division-${key}`}
            data-group={key}
            key={key}
          >
            <div className="catalog-group__header">
              <span className="catalog-group__index">§ {String(gi + 1).padStart(2, '0')}</span>
              <span className="catalog-group__label">{t(`projects.${key}`, key)}</span>
              <span className="catalog-group__count">({items.length})</span>
              <span className="catalog-group__rule" aria-hidden="true" />
            </div>
            <div className="editorial-list editorial-list--minimal">
              {items.map((project, i) => (
                <ProjectEntry
                  key={project._id}
                  project={project}
                  index={i}
                  locale={i18n.language}
                  onOpen={() => {
                    if (project.slug?.current) {
                      onNavigate(`/projects/${project.slug.current}`)
                    } else {
                      console.warn('Project is missing a slug. Please generate one in Sanity.')
                    }
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function ProjectEntry({ project, index, locale, onOpen }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const isWip = project.status === 'in-progress'
  const dateStr = project.startedAt
    ? new Date(project.startedAt).toLocaleDateString(locale || 'en', { month: 'short', year: 'numeric' })
    : null

  return (
    <motion.article
      className="editorial-entry"
      onClick={onOpen}
      style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
      initial={reduceMotion ? false : { opacity: 0, y: 40 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
      transition={reduceMotion ? undefined : { type: 'tween', duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.45) }}
    >
      <div className="editorial-entry__date-col">
        {dateStr && <span className="editorial-entry__date">{dateStr}</span>}
        {isWip && (
          <span className="project-status project-status--wip">
            <span className="project-status__dot" aria-hidden="true" />
            {t('projects.inProgress', 'In progress')}
          </span>
        )}
      </div>
      <div className="editorial-entry__text">
        <h3 className="editorial-entry__title">{project.title}</h3>
        {project.description && (
          <p className="editorial-entry__excerpt">{project.description}</p>
        )}
      </div>
      {project.cover && (
        <div className="editorial-entry__cover">
          <img
            src={urlFor(project.cover).width(600).height(400).fit('crop').url()}
            alt=""
            loading="lazy"
          />
        </div>
      )}
    </motion.article>
  )
}
