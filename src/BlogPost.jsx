import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PortableText } from '@portabletext/react'
import { client, urlFor } from './sanityClient'
import { Footer } from './Footer'
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
          className="blog-post-img"
        />
      )
    }
  },
  block: {
    h1: ({children}) => <h1 className="blog-post-h1">{children}</h1>,
    h2: ({children}) => <h2 className="blog-post-h2">{children}</h2>,
    h3: ({children}) => <h3 className="blog-post-h3">{children}</h3>,
    normal: ({children}) => <p className="blog-post-p">{children}</p>,
    blockquote: ({children}) => <blockquote className="blog-post-blockquote">{children}</blockquote>,
  },
  list: {
    bullet: ({children}) => <ul className="blog-post-ul">{children}</ul>,
    number: ({children}) => <ol className="blog-post-ol">{children}</ol>,
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
    <div className="page-content expanded">
      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
        <section className="section">
          <div className="section-wrapper blog-post-wrapper">
            
            <button 
              onClick={() => onNavigate('/blog')}
              className="blog-post-back-btn"
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
                <header className="blog-post-header">
                  {post.categories?.length > 0 && (
                    <div className="blog-post-categories">
                      {post.categories.map(cat => (
                        <span key={cat} className="blog-post-category">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <h1 className="blog-post-title">
                    {post.title}
                  </h1>
                  
                  <div className="blog-post-meta">
                    {post.authorImage && (
                      <img 
                        src={urlFor(post.authorImage).width(100).height(100).fit('crop').url()} 
                        alt={post.authorName}
                        className="blog-post-author-img"
                      />
                    )}
                    <div>
                      {post.authorName && <div className="blog-post-author-name">{post.authorName}</div>}
                      {post.publishedAt && <div>{new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>}
                    </div>
                  </div>
                </header>

                {post.mainImage && (
                  <div className="blog-post-main-img-wrapper">
                    <img 
                      src={urlFor(post.mainImage).width(1200).height(600).fit('crop').auto('format').url()} 
                      alt={post.title}
                      className="blog-post-main-img"
                    />
                  </div>
                )}

                <div className="blog-content blog-post-body">
                  <PortableText value={post.body} components={ptComponents} />
                </div>
              </article>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
