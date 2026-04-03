import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { client, urlFor } from './sanityClient'
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
    <div className="page-content expanded" style={{ opacity: 1 }}>
      <div style={{ paddingTop: 'var(--space-xl)' }}>
        <section className="section portfolio-section">
          <div className="section-wrapper">
            <div className="portfolio-header">
              <h2 className="section-heading-center">{t('blog.title', 'Blog')}</h2>
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

            {!loading && posts.length === 0 && (
              <p className="portfolio-empty">{t('blog.empty', 'No posts available at the moment.')}</p>
            )}

            {!loading && posts.length > 0 && (
              <div className="portfolio-grid">
                {posts.map((post, i) => {
                  const coverUrl = post.mainImage
                    ? urlFor(post.mainImage).width(800).height(600).fit('crop').auto('format').url()
                    : null
                  
                  return (
                    <div
                      key={post._id}
                      className="portfolio-card"
                      style={{ animationDelay: `${i * 0.07}s`, cursor: 'pointer' }}
                      onClick={() => onNavigate(`/blog/${post.slug.current}`)}
                    >
                      <div className="portfolio-card-media">
                        {coverUrl ? (
                          <img src={coverUrl} alt={post.title} className="portfolio-card-img" loading="lazy" />
                        ) : (
                          <div className="portfolio-card-placeholder" />
                        )}
                      </div>
                      <div className="portfolio-card-info">
                        {post.categories?.length > 0 && (
                          <span className="portfolio-card-division">{post.categories[0]}</span>
                        )}
                        <h3 className="portfolio-card-title">{post.title}</h3>
                        {post.excerpt && (
                          <p className="portfolio-card-desc">{post.excerpt}</p>
                        )}
                        <div className="portfolio-card-tags" style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.85rem' }}>
                          <span>{post.authorName && `By ${post.authorName} • `}{post.publishedAt && new Date(post.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">© 2024 Coresearch. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}
