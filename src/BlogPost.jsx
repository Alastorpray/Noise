import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PortableText } from '@portabletext/react'
import { client, urlFor } from './sanityClient'
import { Footer } from './Footer'
import { AnimatedWords } from './AnimatedText'
import { Reveal } from './Reveal'
import { ShareButtons } from './ShareButtons'
import { SEO } from './SEO'
import { ScrollProgress } from './ScrollProgress'
import { getReadingTimeMinutes } from './utils/readingTime'
import './landing.css'

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  title, publishedAt, excerpt, mainImage, body,
  "authorName": author->name,
  "authorImage": author->image,
  "categories": categories[]->title
}`

const SIBLINGS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  title, "slug": slug.current
}`

function getVideoEmbedUrl(url) {
  if (!url) return null
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

const CALLOUT_ICONS = { tip: '💡', info: 'ℹ️', warning: '⚠️', danger: '🚨' }

const ptComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) return null
      return (
        <figure className="blog-figure">
          <img
            alt={value.alt || ' '}
            loading="lazy"
            src={urlFor(value).width(800).fit('max').auto('format').url()}
            className="blog-post-img"
          />
          {value.caption && <figcaption className="blog-img-caption">{value.caption}</figcaption>}
        </figure>
      )
    },

    codeBlock: ({ value }) => (
      <div className="blog-code-block">
        {(value.filename || value.language) && (
          <div className="blog-code-header">
            {value.filename && <span className="blog-code-filename">{value.filename}</span>}
            {value.language && <span className="blog-code-lang">{value.language}</span>}
          </div>
        )}
        <pre className="blog-code-pre"><code>{value.code}</code></pre>
      </div>
    ),

    callout: ({ value }) => (
      <div className={`blog-callout blog-callout--${value.type || 'info'}`}>
        <span className="blog-callout-icon">{CALLOUT_ICONS[value.type] || 'ℹ️'}</span>
        <p className="blog-callout-text">{value.text}</p>
      </div>
    ),

    videoEmbed: ({ value }) => {
      const embedUrl = getVideoEmbedUrl(value.url)
      if (!embedUrl) return null
      return (
        <figure className="blog-video-embed">
          <div className="blog-video-embed-wrapper">
            <iframe
              src={embedUrl}
              title={value.caption || 'Video'}
              allowFullScreen
              loading="lazy"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          {value.caption && <figcaption className="blog-img-caption">{value.caption}</figcaption>}
        </figure>
      )
    },

    divider: ({ value }) => {
      const style = value.style || 'line'
      if (style === 'dots') return <div className="blog-divider blog-divider--dots"><span>·</span><span>·</span><span>·</span></div>
      if (style === 'space') return <div className="blog-divider blog-divider--space" />
      return <hr className="blog-divider blog-divider--line" />
    },
  },

  block: {
    h2: ({ children }) => <h2 className="blog-post-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="blog-post-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="blog-post-h4">{children}</h4>,
    normal: ({ children }) => <p className="blog-post-p">{children}</p>,
    blockquote: ({ children }) => <blockquote className="blog-post-blockquote">{children}</blockquote>,
  },

  list: {
    bullet: ({ children }) => <ul className="blog-post-ul">{children}</ul>,
    number: ({ children }) => <ol className="blog-post-ol">{children}</ol>,
  },

  marks: {
    link: ({ value, children }) => (
      <a
        href={value.href}
        target={value.blank ? '_blank' : '_self'}
        rel={value.blank ? 'noopener noreferrer' : undefined}
        className="blog-link"
      >
        {children}
      </a>
    ),
    highlight: ({ value, children }) => (
      <mark className={`blog-highlight blog-highlight--${value.color || 'orange'}`}>{children}</mark>
    ),
    code: ({ children }) => <code className="blog-inline-code">{children}</code>,
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    underline: ({ children }) => <span style={{ textDecoration: 'underline' }}>{children}</span>,
    'strike-through': ({ children }) => <s>{children}</s>,
  },
}

export function BlogPost({ slug, onNavigate }) {
  const { t } = useTranslation()
  const [post, setPost] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      client.fetch(POST_QUERY, { slug }),
      client.fetch(SIBLINGS_QUERY),
    ])
      .then(([data, list]) => {
        if (!data) throw new Error('Post not found')
        setPost(data)
        setSiblings(list || [])
        setLoading(false)
      })
      .catch(e => {
        console.error('[Blog] Sanity fetch error:', e)
        setError(e.message)
        setLoading(false)
      })
  }, [slug])

  const currentIdx = siblings.findIndex(p => p.slug === slug)
  const prev = currentIdx > 0 ? siblings[currentIdx - 1] : null
  const next = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  const readingMinutes = post?.body ? getReadingTimeMinutes(post.body) : null
  const postImage = post?.mainImage ? urlFor(post.mainImage).width(1200).height(630).fit('crop').auto('format').url() : undefined

  return (
    <div className="page-content expanded">
      {post && (
        <SEO
          title={post.title}
          description={post.excerpt || undefined}
          image={postImage}
          type="article"
          publishedTime={post.publishedAt}
        />
      )}
      <ScrollProgress />
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
              <article key={slug}>
                <header className="blog-post-header">
                  {post.categories?.length > 0 && (
                    <Reveal as="div" className="blog-post-categories" delay={0.05}>
                      {post.categories.map(cat => (
                        <span key={cat} className="blog-post-category">
                          {cat}
                        </span>
                      ))}
                    </Reveal>
                  )}

                  <AnimatedWords
                    as="h1"
                    className="blog-post-title"
                    text={post.title}
                    delay={120}
                    stagger={55}
                  />

                  <Reveal as="div" className="blog-post-meta" delay={0.15}>
                    {post.authorImage && (
                      <img
                        src={urlFor(post.authorImage).width(100).height(100).fit('crop').url()}
                        alt={post.authorName}
                        className="blog-post-author-img"
                      />
                    )}
                    <div>
                      {post.authorName && <div className="blog-post-author-name">{post.authorName}</div>}
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {post.publishedAt && new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        {readingMinutes && (
                          <>
                            {post.publishedAt && <span className="blog-post-meta-sep"> · </span>}
                            <span>{t('post.readingTime', '{{min}} min read', { min: readingMinutes })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Reveal>
                </header>

                {post.mainImage && (
                  <Reveal as="div" className="blog-post-main-img-wrapper" delay={0.25}>
                    <img
                      src={urlFor(post.mainImage).width(1200).height(600).fit('crop').auto('format').url()}
                      alt={post.title}
                      className="blog-post-main-img"
                    />
                  </Reveal>
                )}

                <Reveal as="div" className="blog-content blog-post-body" delay={0.35}>
                  <PortableText value={post.body} components={ptComponents} />
                </Reveal>

                <ShareButtons title={post.title} />

                {(prev || next) && (
                  <nav className="post-nav" aria-label="Post navigation">
                    {prev ? (
                      <button
                        type="button"
                        className="post-nav__item post-nav__item--prev"
                        onClick={() => onNavigate(`/blog/${prev.slug}`)}
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
                        onClick={() => onNavigate(`/blog/${next.slug}`)}
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
                )}
              </article>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
