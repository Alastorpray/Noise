import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PortableText } from '@portabletext/react'
import { client, urlFor } from './sanityClient'
import './landing.css'

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  title, publishedAt, mainImage, body,
  "authorName": author->name,
  "authorImage": author->image,
  "categories": categories[]->title
}`

const ptComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null
      }
      return (
        <img
          alt={value.alt || ' '}
          loading="lazy"
          src={urlFor(value).width(800).fit('max').auto('format').url()}
          style={{ maxWidth: '100%', borderRadius: '8px', margin: '2rem 0' }}
        />
      )
    }
  },
  block: {
    h1: ({children}) => <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', marginTop: '2rem' }}>{children}</h1>,
    h2: ({children}) => <h2 style={{ fontSize: '2rem', marginBottom: '1rem', marginTop: '2rem' }}>{children}</h2>,
    h3: ({children}) => <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>{children}</h3>,
    normal: ({children}) => <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{children}</p>,
    blockquote: ({children}) => <blockquote style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '1rem', fontStyle: 'italic', margin: '1.5rem 0' }}>{children}</blockquote>,
  },
  list: {
    bullet: ({children}) => <ul style={{ paddingLeft: '2rem', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>{children}</ul>,
    number: ({children}) => <ol style={{ paddingLeft: '2rem', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>{children}</ol>,
  },
}

export function BlogPost({ slug, onNavigate }) {
  const { t } = useTranslation()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    client.fetch(POST_QUERY, { slug })
      .then(data => {
        if (!data) throw new Error('Post not found')
        setPost(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('[Blog] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [slug])

  return (
    <div className="page-content expanded" style={{ opacity: 1 }}>
      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
        <section className="section">
          <div className="section-wrapper" style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <button 
              onClick={() => onNavigate('/blog')}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
                marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '1rem', fontWeight: 'bold'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {t('blog.back', 'Back to Blog')}
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

            {!loading && post && (
              <article>
                <header style={{ marginBottom: '3rem' }}>
                  {post.categories?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      {post.categories.map(cat => (
                        <span key={cat} style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem', fontWeight: 'bold', marginRight: '1rem' }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <h1 style={{ fontSize: '3.5rem', lineHeight: '1.2', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                    {post.title}
                  </h1>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    {post.authorImage && (
                      <img 
                        src={urlFor(post.authorImage).width(100).height(100).fit('crop').url()} 
                        alt={post.authorName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      {post.authorName && <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{post.authorName}</div>}
                      {post.publishedAt && <div>{new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>}
                    </div>
                  </div>
                </header>

                {post.mainImage && (
                  <div style={{ marginBottom: '3rem', borderRadius: '12px', overflow: 'hidden' }}>
                    <img 
                      src={urlFor(post.mainImage).width(1200).height(600).fit('crop').auto('format').url()} 
                      alt={post.title}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                )}

                <div className="blog-content" style={{ color: 'var(--text-primary)' }}>
                  <PortableText value={post.body} components={ptComponents} />
                </div>
              </article>
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
