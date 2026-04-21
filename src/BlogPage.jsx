import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
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
        <span className="editorial-hero__eyebrow reveal-up">{t('blog.eyebrow', 'Blog')}</span>
        <AnimatedWords
          as="h1"
          className="editorial-hero__title"
          text={t('blog.heroTitle', 'Insights.')}
          delay={150}
          stagger={70}
        />
        <p className="editorial-hero__subtitle reveal-up reveal-delay-4">
          {t('blog.heroSubtitle', 'Notes, experiments and deep-dives on creative technology, shaders and real-time graphics.')}
        </p>
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
                  <article
                    key={post._id}
                    className="editorial-entry"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => onNavigate(`/blog/${post.slug.current}`)}
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
                  </article>
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
