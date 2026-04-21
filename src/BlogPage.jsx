import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { motion, useReducedMotion } from 'framer-motion'
import './landing.css'

const BLOG_QUERY = `*[_type == "post"] | order(publishedAt desc) {
  _id, title, slug, publishedAt, excerpt, mainImage,
  "authorName": author->name,
  "categories": categories[]->title
}`

export function BlogPage({ onNavigate }) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    client.fetch(BLOG_QUERY)
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('[Blog] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="page-content expanded">
      <header className="editorial-hero">
        <Reveal as="span" className="editorial-hero__eyebrow" delay={0.05}>
          {t('blog.eyebrow', 'Blog')}
        </Reveal>
        <AnimatedWords
          as="h1"
          className="editorial-hero__title"
          text={t('blog.heroTitle', 'Insights.')}
          delay={150}
          stagger={70}
        />
        <Reveal as="p" className="editorial-hero__subtitle" delay={0.25}>
          {t('blog.heroSubtitle', 'Notes, experiments and deep-dives on creative technology, shaders and real-time graphics.')}
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

          {!loading && posts.length === 0 && (
            <p className="portfolio-empty">{t('blog.empty', 'No posts available at the moment.')}</p>
          )}

          {!loading && posts.length > 0 && (
            <div className="editorial-list editorial-list--minimal">
              {posts.map((post, i) => {
                const dateStr = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })
                  : null
                const category = post.categories?.[0]

                return (
                  <motion.article
                    key={post._id}
                    className="editorial-entry"
                    onClick={() => onNavigate(`/blog/${post.slug.current}`)}
                    style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
                    initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
                    transition={reduceMotion ? undefined : { type: 'tween', duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.05, 0.45) }}
                  >
                    <div className="editorial-entry__date-col">
                      {dateStr && <span className="editorial-entry__date">{dateStr}</span>}
                      {category && <span className="editorial-entry__meta">{category}</span>}
                    </div>
                    <div className="editorial-entry__text">
                      <h3 className="editorial-entry__title">{post.title}</h3>
                      {post.excerpt && (
                        <p className="editorial-entry__excerpt">{post.excerpt}</p>
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
